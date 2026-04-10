"""FIT 文件解析与进度报告的共享工具函数。"""

import os
import sys
from typing import List, Tuple

import fitparse


def print_progress(message: str):
    """输出进度信息到 stderr（供 Node.js 捕获）。"""
    print(f"PROGRESS: {message}", file=sys.stderr, flush=True)


def extract_gps_data(fit_file_path: str) -> List[Tuple[float, float]]:
    """从 FIT 文件提取 GPS 坐标 [(lat_deg, lon_deg), ...]。"""
    try:
        fit_file = fitparse.FitFile(fit_file_path)
        gps_data: List[Tuple[float, float]] = []

        for record in fit_file.get_messages("record"):
            lat = record.get_value("position_lat")
            lon = record.get_value("position_long")

            if lat is None or lon is None or lat == 0 or lon == 0:
                continue

            lat_deg = lat / (2**31) * 180
            lon_deg = lon / (2**31) * 180
            gps_data.append((lat_deg, lon_deg))

        return gps_data
    except Exception as error:
        print_progress(f"提取 GPS 数据失败 {os.path.basename(fit_file_path)}: {error}")
        return []
