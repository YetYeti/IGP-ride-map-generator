#!/usr/bin/env python3
"""生成轨迹叠加网页的Python脚本"""

import sys
import os
import json
import traceback
import argparse
from typing import List, Tuple
import fitparse
import folium

# 常量
TRACK_COLOR = "#F1532E"
TRACK_WEIGHT = 2
TRACK_OPACITY = 0.7

# 地图样式配置 - 使用 folium.TileLayer 对象
MAP_TILES = {
    "default": lambda m: folium.raster_layers.TileLayer(
        tiles="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attr='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        name="OpenStreetMap",
        control=True,
    ).add_to(m),
    "cartodb_positron": lambda m: folium.raster_layers.TileLayer(
        tiles="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        attr='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains="abcd",
        name="CartoDB Positron",
        control=True,
    ).add_to(m),
    "cartodb_positron_nolabels": lambda m: folium.raster_layers.TileLayer(
        tiles="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        attr='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains="abcd",
        name="CartoDB Positron No Labels",
        control=True,
    ).add_to(m),
    "cartodb_darkmatter": lambda m: folium.raster_layers.TileLayer(
        tiles="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attr='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains="abcd",
        name="CartoDB Dark Matter",
        control=True,
    ).add_to(m),
    "cartodb_darkmatter_nolabels": lambda m: folium.raster_layers.TileLayer(
        tiles="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        attr='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains="abcd",
        name="CartoDB Dark Matter No Labels",
        control=True,
    ).add_to(m),
}


def print_progress(message: str):
    """输出进度信息到 stderr"""
    print(f"PROGRESS: {message}", file=sys.stderr, flush=True)


def extract_gps_data(fit_file_path: str) -> List[Tuple[float, float]]:
    """从FIT文件提取GPS数据"""
    try:
        fit_file = fitparse.FitFile(fit_file_path)
        gps_data = []

        for record in fit_file.get_messages("record"):
            lat = record.get_value("position_lat")
            long = record.get_value("position_long")

            if lat is not None and long is not None and lat != 0 and long != 0:
                lat_deg = lat / (2**31) * 180
                long_deg = long / (2**31) * 180
                gps_data.append((lat_deg, long_deg))

        return gps_data
    except Exception as e:
        print_progress(f"提取GPS数据失败 {os.path.basename(fit_file_path)}: {str(e)}")
        return []


def generate_overlay_map(
    all_gps_data: List[List[Tuple[float, float]]], output_path: str, map_style: str
) -> bool:
    """生成叠加轨迹图（优化版：单遍遍历，减少内存占用）"""
    if not all_gps_data:
        return False

    try:
        # 初始化边界值追踪
        lat_min = float("inf")
        lat_max = float("-inf")
        long_min = float("inf")
        long_max = float("-inf")

        total_tracks = 0

        # 创建地图对象（初始位置，稍后会更新中心点）
        m = folium.Map(
            location=[0, 0],
            zoom_start=12,
            tiles=None,  # 不使用默认瓦片
        )

        # 添加指定样式的地图瓦片层
        if map_style in MAP_TILES:
            MAP_TILES[map_style](m)
        else:
            MAP_TILES["default"](m)

        # 单遍遍历：更新边界值 + 添加轨迹（避免累积 all_lats/all_longs）
        for gps_data in all_gps_data:
            if not gps_data:
                continue

            # 更新边界值
            for lat, long in gps_data:
                lat_min = min(lat_min, lat)
                lat_max = max(lat_max, lat)
                long_min = min(long_min, long)
                long_max = max(long_max, long)

            # 添加轨迹到地图
            coords = [[point[0], point[1]] for point in gps_data]
            folium.PolyLine(
                coords,
                color=TRACK_COLOR,
                weight=TRACK_WEIGHT,
                opacity=TRACK_OPACITY,
                line_cap="round",
                line_join="round",
            ).add_to(m)

            total_tracks += 1
            if total_tracks % 50 == 0:
                print_progress(f"已处理 {total_tracks}/{len(all_gps_data)} 条轨迹...")

        # 计算中心点
        lat_center = (lat_min + lat_max) / 2
        long_center = (long_min + long_max) / 2

        # 更新地图中心点
        m.location = [lat_center, long_center]

        # 保存HTML文件
        m.save(output_path)

        return True
    except Exception as e:
        print_progress(f"生成叠加轨迹图失败: {str(e)}")
        return False


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="生成轨迹叠加网页")
    parser.add_argument("fit_files", nargs="+", help="FIT文件路径")
    parser.add_argument("output_path", help="输出HTML文件路径")
    parser.add_argument("map_style", help="地图样式")

    args = parser.parse_args()

    try:
        print_progress(f"开始生成交互式地图，共 {len(args.fit_files)} 个FIT文件")
        print_progress(f"使用地图样式: {args.map_style}")

        all_gps_data = []

        # 提取所有GPS数据
        for i, fit_file in enumerate(args.fit_files, 1):
            print_progress(f"正在处理活动 {i}/{len(args.fit_files)} ...")

            gps_data = extract_gps_data(fit_file)

            if not gps_data:
                continue

            all_gps_data.append(gps_data)

        print_progress(f"成功提取 {len(all_gps_data)} 个轨迹的GPS数据")

        # 生成交互式地图
        if all_gps_data:
            print_progress("正在生成交互式地图...")
            success = generate_overlay_map(all_gps_data, args.output_path, args.map_style)

            if success:
                result = {
                    "success": True,
                    "total_tracks": len(all_gps_data),
                    "map_style": args.map_style,
                    "output_path": args.output_path,
                }
                print(json.dumps(result, ensure_ascii=False))
            else:
                print(
                    json.dumps(
                        {"success": False, "error": "生成交互式地图失败"}, ensure_ascii=False
                    )
                )
                sys.exit(1)
        else:
            print(json.dumps({"success": False, "error": "没有有效的GPS数据"}, ensure_ascii=False))
            sys.exit(1)

    except Exception as e:
        print(
            json.dumps(
                {"success": False, "error": str(e), "stack": traceback.format_exc()},
                ensure_ascii=False,
            )
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
