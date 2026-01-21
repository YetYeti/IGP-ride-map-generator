#!/usr/bin/env python3
"""生成轨迹合成图的Python脚本"""

import sys
import os
import json
import re
import traceback
import argparse
from typing import List, Tuple
import fitparse
import matplotlib

matplotlib.use("Agg")  # 使用非GUI后端
import matplotlib.pyplot as plt
from PIL import Image
import math

# 常量
TRACK_COLOR = "#F1532E"
DEFAULT_TRACK_LINEWIDTH = 4
DEFAULT_MARGIN = 300
DEFAULT_COLUMNS = 6
BACKGROUND_COLOR = "black"
IMAGE_DPI = 100
FIG_SIZE_PURE = (10, 10)
MAP_MARGIN_RATIO = 0.1  # 地图边距比例 (相对于最大范围)


def print_progress(message: str):
    """输出进度信息到 stderr"""
    print(f"PROGRESS: {message}", file=sys.stderr, flush=True)


def _extract_ride_id(filepath: str) -> int:
    match = re.search(r"(\d+)\.png$", os.path.basename(filepath))
    return int(match.group(1)) if match else 0


def _set_map_bounds(ax, lats: List[float], longs: List[float]):
    """设置地图范围，确保轨迹居中且保持正确的宽高比

    Args:
        ax: matplotlib axes对象
        lats: 纬度列表
        longs: 经度列表
    """
    lat_min, lat_max = min(lats), max(lats)
    long_min, long_max = min(longs), max(longs)

    # 计算经纬度范围
    lat_range = lat_max - lat_min
    long_range = long_max - long_min

    # 计算中心点
    lat_center = (lat_min + lat_max) / 2
    long_center = (long_min + long_max) / 2

    # 确定最大范围，确保轨迹居中
    max_range = max(lat_range, long_range)
    margin = max_range * MAP_MARGIN_RATIO

    # 设置地图范围
    ax.set_xlim(long_center - (max_range + margin) / 2, long_center + (max_range + margin) / 2)
    ax.set_ylim(lat_center - (max_range + margin) / 2, lat_center + (max_range + margin) / 2)

    # 确保宽高比正确
    ax.set_aspect("equal")


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


def generate_single_track(
    gps_data: List[Tuple[float, float]], output_path: str, track_width: int
) -> bool:
    """生成单个轨迹图"""
    if not gps_data:
        return False

    try:
        lats = [point[0] for point in gps_data]
        longs = [point[1] for point in gps_data]

        fig, ax = plt.subplots(figsize=FIG_SIZE_PURE)
        fig.patch.set_facecolor(BACKGROUND_COLOR)
        ax.set_facecolor(BACKGROUND_COLOR)

        ax.plot(longs, lats, color=TRACK_COLOR, linewidth=track_width, alpha=1.0)
        ax.set_axis_off()

        # 设置地图范围，确保轨迹居中且保持正确的宽高比
        _set_map_bounds(ax, lats, longs)

        plt.savefig(
            output_path, dpi=IMAGE_DPI, bbox_inches="tight", pad_inches=0, transparent=False
        )
        plt.close()

        return True
    except Exception as e:
        print_progress(f"生成轨迹图失败 {output_path}: {str(e)}")
        return False


def generate_combined_map(
    image_files: List[str], output_path: str, margin: int, columns: int
) -> bool:
    """生成合并轨迹大图"""
    if not image_files:
        return False

    try:
        image_files.sort(key=_extract_ride_id)
        num_images = len(image_files)
        cols = columns
        rows = math.ceil(num_images / cols)

        # 打开第一张图片获取尺寸
        with Image.open(image_files[0]) as img:
            img_width, img_height = img.size

        combined_width = (img_width * cols) + ((cols + 1) * margin)
        combined_height = (img_height * rows) + ((rows + 1) * margin)

        # 创建大图
        combined_img = Image.new("RGB", (combined_width, combined_height), color="black")

        # 逐张粘贴图片
        for i, img_path in enumerate(image_files):
            with Image.open(img_path) as img:
                row = i // cols
                col = i % cols
                x = margin + (col * (img_width + margin))
                y = margin + (row * (img_height + margin))
                combined_img.paste(img, (x, y))

        # 缩放到固定宽度1200
        target_width = 1200
        scale_ratio = target_width / combined_width
        new_height = int(combined_height * scale_ratio)
        combined_img = combined_img.resize((target_width, new_height), Image.Resampling.LANCZOS)

        combined_img.save(output_path, quality=95)

        return True
    except Exception as e:
        print_progress(f"生成合并大图失败: {str(e)}")
        return False


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="生成轨迹合成图")
    parser.add_argument("fit_files", nargs="+", help="FIT文件路径")
    parser.add_argument("output_path", help="输出文件路径")
    parser.add_argument("--track-width", type=int, default=DEFAULT_TRACK_LINEWIDTH, help="轨迹线宽")
    parser.add_argument("--margin", type=int, default=DEFAULT_MARGIN, help="图片间距")
    parser.add_argument("--columns", type=int, default=DEFAULT_COLUMNS, help="每列图片数")

    args = parser.parse_args()

    try:
        print_progress(f"开始生成合成图，共 {len(args.fit_files)} 个FIT文件")

        # 临时目录存储单个轨迹图
        import tempfile

        temp_dir = tempfile.mkdtemp()

        generated_images = []

        # 为每个FIT文件生成单个轨迹图
        for i, fit_file in enumerate(args.fit_files, 1):
            print_progress(f"正在处理活动 {i}/{len(args.fit_files)} ...")

            gps_data = extract_gps_data(fit_file)

            if not gps_data:
                continue

            ride_id = os.path.splitext(os.path.basename(fit_file))[0]
            temp_image_path = os.path.join(temp_dir, f"{ride_id}.png")
            if generate_single_track(gps_data, temp_image_path, args.track_width):
                generated_images.append(temp_image_path)

        print_progress(f"成功生成 {len(generated_images)} 个轨迹图")

        # 生成合并大图
        if generated_images:
            print_progress("正在生成合并大图...")
            success = generate_combined_map(
                generated_images, args.output_path, args.margin, args.columns
            )

            if success:
                result = {
                    "success": True,
                    "total_tracks": len(generated_images),
                    "grid_size": f"{math.ceil(len(generated_images) / args.columns)}x{args.columns}",
                    "output_path": args.output_path,
                }
                print(json.dumps(result, ensure_ascii=False))
            else:
                print(
                    json.dumps({"success": False, "error": "生成合并大图失败"}, ensure_ascii=False)
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
