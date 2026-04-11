#!/usr/bin/env python3
"""批量提取 FIT 文件 GPS 数据并写入 JSON 缓存，供后续生成脚本复用。"""

import argparse
import json
import os
import sys
import traceback
from typing import List, Tuple

from fit_utils import (
    extract_gps_data,
    get_ride_id_from_fit_path,
    load_persistent_gps_cache,
    print_progress,
    save_persistent_gps_cache,
)


def main():
    parser = argparse.ArgumentParser(description="提取 FIT 文件 GPS 数据到 JSON 缓存")
    parser.add_argument("fit_files", nargs="+", help="FIT 文件路径")
    parser.add_argument("output_path", help="输出 JSON 文件路径")
    args = parser.parse_args()

    try:
        cache: List[dict] = []
        total = len(args.fit_files)

        print_progress(f"开始提取 GPS 缓存，共 {total} 个 FIT 文件")

        for i, fit_file in enumerate(args.fit_files, 1):
            print_progress(f"正在提取 GPS 数据 {i}/{total} ...")

            ride_id = get_ride_id_from_fit_path(fit_file)
            gps_data = load_persistent_gps_cache(ride_id) if ride_id else None

            if gps_data:
                print_progress(f"活动 {ride_id} 命中 GPS 持久缓存")
            else:
                gps_data = extract_gps_data(fit_file)
                if gps_data and ride_id:
                    save_persistent_gps_cache(ride_id, fit_file, gps_data)
                    print_progress(f"活动 {ride_id} 已写入 GPS 持久缓存")

            if gps_data:
                cache.append(
                    {
                        "file": os.path.abspath(fit_file),
                        "points": gps_data,
                    }
                )

        print_progress(f"成功提取 {len(cache)} 个轨迹的 GPS 数据")

        os.makedirs(os.path.dirname(args.output_path), exist_ok=True)
        with open(args.output_path, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False)

        print(
            json.dumps(
                {
                    "success": True,
                    "track_count": len(cache),
                },
                ensure_ascii=False,
            )
        )
    except Exception as e:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": str(e),
                    "stack": traceback.format_exc(),
                },
                ensure_ascii=False,
            )
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
