"""FIT 文件解析与进度报告的共享工具函数。"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import fitparse

PROJECT_ROOT = Path(os.environ.get("PROJECT_ROOT") or os.getcwd()).resolve()
GPS_CACHE_DIR = PROJECT_ROOT / "cache" / "gps"


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


def load_gps_cache(cache_path: str) -> Dict[str, List[Tuple[float, float]]]:
    """加载 GPS 缓存 JSON，返回 {abs_fit_path: [(lat, lon), ...]} 字典。"""
    with open(cache_path, "r", encoding="utf-8") as f:
        entries = json.load(f)

    cache: Dict[str, List[Tuple[float, float]]] = {}
    for entry in entries:
        file_path = entry.get("file", "")
        points = entry.get("points", [])
        if file_path and points:
            cache[os.path.abspath(file_path)] = [(p[0], p[1]) for p in points]

    return cache


def get_persistent_gps_cache_path(ride_id: str) -> Path:
    """根据 rideId 获取持久 GPS 缓存路径。"""
    return GPS_CACHE_DIR / f"{ride_id}.json"


def get_ride_id_from_fit_path(fit_file_path: str) -> str | None:
    """从 FIT 文件路径推导 rideId。"""
    ride_id = Path(fit_file_path).stem.strip()
    return ride_id if ride_id.isdigit() else None


def load_persistent_gps_cache(ride_id: str) -> List[Tuple[float, float]] | None:
    """加载按 rideId 持久化的 GPS 缓存。"""
    cache_path = get_persistent_gps_cache_path(ride_id)
    if not cache_path.exists():
        return None

    try:
        payload = json.loads(cache_path.read_text(encoding="utf-8"))
        points = payload.get("points", [])
        if not points:
            return None
        return [(point[0], point[1]) for point in points]
    except Exception as error:
        print_progress(f"读取 GPS 持久缓存失败 {ride_id}: {error}")
        return None


def save_persistent_gps_cache(ride_id: str, fit_file_path: str, points: List[Tuple[float, float]]):
    """保存按 rideId 持久化的 GPS 缓存。"""
    GPS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = get_persistent_gps_cache_path(ride_id)
    payload = {
        "ride_id": ride_id,
        "file": os.path.abspath(fit_file_path),
        "points": points,
    }
    cache_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
