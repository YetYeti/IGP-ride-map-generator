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

from fit_utils import print_progress, extract_gps_data, load_gps_cache

TRACK_COLOR = "#F1532E"
DEFAULT_TRACK_LINEWIDTH = 4
DEFAULT_TRACK_SPACING = 300
DEFAULT_COLUMNS = 6
BACKGROUND_COLOR = "black"
IMAGE_DPI = 200
FIG_SIZE_PURE = (12, 12)
DEFAULT_TRACK_PADDING = 0.1  # 地图边距比例 (相对于最大范围)


def _extract_ride_id(filepath: str) -> int:
    match = re.search(r"(\d+)\.png$", os.path.basename(filepath))
    return int(match.group(1)) if match else 0


def _set_map_bounds(
    ax, lats: List[float], longs: List[float], track_padding: float = DEFAULT_TRACK_PADDING
):
    """设置地图范围，确保轨迹居中且保持正确的宽高比

    Args:
        ax: matplotlib axes对象
        lats: 纬度列表
        longs: 经度列表
        track_padding: 轨迹内边距比例
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
    padding = max_range * track_padding

    # 设置地图范围
    ax.set_xlim(long_center - (max_range + padding) / 2, long_center + (max_range + padding) / 2)
    ax.set_ylim(lat_center - (max_range + padding) / 2, lat_center + (max_range + padding) / 2)

    # 确保宽高比正确
    ax.set_aspect("equal")


def generate_single_track(
    gps_data: List[Tuple[float, float]],
    output_path: str,
    track_width: int,
    track_padding: float = DEFAULT_TRACK_PADDING,
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

        try:
            ax.plot(longs, lats, color=TRACK_COLOR, linewidth=track_width, alpha=1.0)
            ax.set_axis_off()

            _set_map_bounds(ax, lats, longs, track_padding)

            plt.savefig(
                output_path, dpi=IMAGE_DPI, bbox_inches="tight", pad_inches=0, transparent=False
            )
        finally:
            plt.close()

        return True
    except Exception as e:
        print_progress(f"生成轨迹图失败 {output_path}: {str(e)}")
        return False


def generate_combined_map(
    image_files: List[str], output_path: str, track_spacing: int, columns: int
) -> bool:
    """生成合并轨迹大图（优化版：预先缩放，减少内存占用）"""
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

        # 计算原始大图尺寸
        combined_width = (img_width * cols) + ((cols + 1) * track_spacing)
        combined_height = (img_height * rows) + ((rows + 1) * track_spacing)

        # 计算目标尺寸（缩放到固定宽度2400）
        target_width = 2400
        scale_ratio = target_width / combined_width
        target_height = int(combined_height * scale_ratio)

        # 计算缩放后的单张图片尺寸和间距
        scaled_img_width = int(img_width * scale_ratio)
        scaled_img_height = int(img_height * scale_ratio)
        scaled_spacing = int(track_spacing * scale_ratio)

        # 创建缩放后的大图（避免创建巨大的中间图像）
        combined_img = Image.new("RGB", (target_width, target_height), color="black")

        # 逐张粘贴图片（先缩放，再粘贴）
        for i, img_path in enumerate(image_files):
            with Image.open(img_path) as img:
                # 先缩放单张图片
                scaled_img = img.resize(
                    (scaled_img_width, scaled_img_height), Image.Resampling.LANCZOS
                )

                # 计算位置
                row = i // cols
                col = i % cols
                x = scaled_spacing + (col * (scaled_img_width + scaled_spacing))
                y = scaled_spacing + (row * (scaled_img_height + scaled_spacing))
                combined_img.paste(scaled_img, (x, y))

        combined_img.save(output_path, format="PNG", optimize=True)

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
    parser.add_argument("--track-spacing", type=int, default=DEFAULT_TRACK_SPACING, help="轨迹间距")
    parser.add_argument("--columns", type=int, default=DEFAULT_COLUMNS, help="每列图片数")
    parser.add_argument(
        "--track-padding", type=float, default=DEFAULT_TRACK_PADDING, help="轨迹内边距"
    )
    parser.add_argument("--gps-cache", type=str, default=None, help="GPS 数据缓存 JSON 路径")

    args = parser.parse_args()

    try:
        print_progress(f"开始生成合成图，共 {len(args.fit_files)} 个FIT文件")

        gps_cache = load_gps_cache(args.gps_cache) if args.gps_cache else {}

        import shutil
        import tempfile

        with tempfile.TemporaryDirectory() as temp_dir:
            generated_images = []

            for i, fit_file in enumerate(args.fit_files, 1):
                print_progress(f"正在处理活动 {i}/{len(args.fit_files)} ...")

                abs_fit = os.path.abspath(fit_file)
                gps_data = (
                    gps_cache.get(abs_fit) if abs_fit in gps_cache else extract_gps_data(fit_file)
                )

                if not gps_data:
                    continue

                ride_id = os.path.splitext(os.path.basename(fit_file))[0]
                temp_image_path = os.path.join(temp_dir, f"{ride_id}.png")
                if generate_single_track(
                    gps_data, temp_image_path, args.track_width, args.track_padding
                ):
                    generated_images.append(temp_image_path)

            print_progress(f"成功生成 {len(generated_images)} 个轨迹图")

            if generated_images:
                print_progress("正在生成合并大图...")
                success = generate_combined_map(
                    generated_images, args.output_path, args.track_spacing, args.columns
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
                        json.dumps(
                            {"success": False, "error": "生成合并大图失败"}, ensure_ascii=False
                        )
                    )
                    sys.exit(1)
            else:
                print(
                    json.dumps({"success": False, "error": "没有有效的GPS数据"}, ensure_ascii=False)
                )
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
