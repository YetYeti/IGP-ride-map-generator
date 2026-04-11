#!/usr/bin/env python3
"""根据 FIT 轨迹生成艺术地图海报原型。"""

from __future__ import annotations

import argparse
import gc
import hashlib
import json
import math
import os
import resource
import sys
import time
import traceback
from pathlib import Path
from typing import Iterable, List, Tuple

import fitparse
import geopandas as gpd
import matplotlib
import networkx as nx
import pandas as pd

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import osmnx as ox
from pyproj import Transformer

from fit_utils import print_progress, extract_gps_data, load_gps_cache

TRACK_COLOR = "#F1532E"
DEFAULT_TRACK_WIDTH = 0.8
DEFAULT_TRACK_OPACITY = 0.82
DEFAULT_PADDING = 0.1
DEFAULT_QUERY_PADDING = 0.18
DEFAULT_WIDTH = 9
DEFAULT_HEIGHT = 16
DEFAULT_THEME = "warm_beige_blue_water"
DEFAULT_NETWORK_TYPE = "bike"
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT_PATH = PROJECT_ROOT / "public" / "fit_files"
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "public" / "outputs"
DEFAULT_OUTPUT_FILENAME = "track_art_poster.png"
ROAD_FETCH_RETRIES = 3
ROAD_FETCH_RETRY_DELAY = 2
MAX_TILE_LON_SPAN = 0.5
MAX_TILE_LAT_SPAN = 0.5
CACHE_VERSION = "v1"
CACHE_ROOT = PROJECT_ROOT / "cache" / "poster_osm"
CACHE_ROADS_DIR = CACHE_ROOT / "roads"
CACHE_FEATURES_DIR = CACHE_ROOT / "features"
DEFAULT_MEMORY_LOG_PATH = PROJECT_ROOT / "cache" / "poster_memory.log"
THEMES_DIR = Path(__file__).with_name("poster_themes")

WATER_TAGS = {
    "natural": ["water", "bay"],
    "water": True,
    "waterway": ["riverbank", "dock", "canal"],
}

PARK_TAGS = {
    "leisure": ["park", "nature_reserve", "garden", "playground"],
    "landuse": ["forest", "grass", "meadow", "recreation_ground", "village_green"],
    "natural": ["wood", "scrub"],
}


def ensure_cache_dirs():
    """确保缓存目录存在。"""
    CACHE_ROADS_DIR.mkdir(parents=True, exist_ok=True)
    CACHE_FEATURES_DIR.mkdir(parents=True, exist_ok=True)


def get_rss_mb() -> float:
    """获取当前进程的常驻内存大小（MB）。"""
    rss_kb = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss

    if sys.platform == "darwin":
        return rss_kb / (1024 * 1024)

    return rss_kb / 1024


def log_memory(stage: str, log_path: str | None = None):
    """记录阶段性内存占用，并写入日志文件。"""
    rss_mb = get_rss_mb()
    message = f"内存占用 {stage}: {rss_mb:.1f} MB"
    print_progress(message)

    if not log_path:
        return

    target_path = Path(log_path).expanduser()
    target_path.parent.mkdir(parents=True, exist_ok=True)
    with target_path.open("a", encoding="utf-8") as log_file:
        log_file.write(
            json.dumps(
                {
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "stage": stage,
                    "rss_mb": round(rss_mb, 1),
                },
                ensure_ascii=False,
            )
            + "\n"
        )


def load_themes() -> dict[str, dict[str, str]]:
    """从主题目录加载海报主题。"""
    themes: dict[str, dict[str, str]] = {}

    for theme_path in sorted(THEMES_DIR.glob("*.json")):
        theme_data = json.loads(theme_path.read_text(encoding="utf-8"))
        themes[theme_path.stem] = theme_data

    if not themes:
        raise ValueError(f"未找到主题配置目录: {THEMES_DIR}")

    return themes


THEMES = load_themes()


def build_output_path_with_theme(output_path: str, theme_name: str) -> str:
    """确保输出文件名包含主题名。"""
    path = Path(output_path)

    if path.stem.endswith(f"_{theme_name}"):
        return str(path)

    return str(path.with_name(f"{path.stem}_{theme_name}{path.suffix}"))


def resolve_output_path(output_path: str) -> str:
    """将输出参数解析为具体图片路径。"""
    path = Path(output_path).expanduser()

    if path.exists() and path.is_dir():
        return str(path / DEFAULT_OUTPUT_FILENAME)

    if path.suffix:
        return str(path)

    return str(path / DEFAULT_OUTPUT_FILENAME)


def collect_tracks(
    fit_files: Iterable[str], gps_cache: dict | None = None
) -> List[List[Tuple[float, float]]]:
    """收集所有有效轨迹。"""
    tracks: List[List[Tuple[float, float]]] = []

    for index, fit_file in enumerate(fit_files, start=1):
        print_progress(f"正在读取轨迹 {index} ...")

        if gps_cache is not None:
            abs_fit = os.path.abspath(fit_file)
            gps_data = gps_cache.get(abs_fit)
            if gps_data is None:
                gps_data = extract_gps_data(fit_file)
        else:
            gps_data = extract_gps_data(fit_file)

        if gps_data:
            tracks.append(gps_data)

    return tracks


def resolve_fit_files(input_path: str) -> List[str]:
    """根据输入路径解析 FIT 文件列表。"""
    path = Path(input_path).expanduser()

    if not path.exists():
        raise FileNotFoundError(f"输入路径不存在: {path}")

    if path.is_file():
        if path.suffix.lower() == ".fit":
            return [str(path)]

        if path.suffix.lower() == ".txt":
            fit_files: List[str] = []

            for line in path.read_text(encoding="utf-8").splitlines():
                line = line.strip()

                if not line:
                    continue

                candidate = Path(line).expanduser()
                if not candidate.is_absolute():
                    candidate = (path.parent / candidate).resolve()

                if candidate.is_file() and candidate.suffix.lower() == ".fit":
                    fit_files.append(str(candidate))

            return fit_files

        raise ValueError(f"不支持的输入文件类型: {path.suffix}")

    fit_paths = sorted(
        file_path
        for file_path in path.rglob("*")
        if file_path.is_file() and file_path.suffix.lower() == ".fit"
    )
    return [str(file_path) for file_path in fit_paths]


def calculate_bounds(tracks: List[List[Tuple[float, float]]]) -> Tuple[float, float, float, float]:
    """计算轨迹经纬度边界。"""
    all_lats = [lat for track in tracks for lat, _ in track]
    all_lons = [lon for track in tracks for _, lon in track]
    return min(all_lons), min(all_lats), max(all_lons), max(all_lats)


def meters_per_degree_lon(latitude: float) -> float:
    """估算该纬度上一度经度对应的米数。"""
    return 111320 * math.cos(math.radians(latitude))


def expand_bbox(
    bbox: Tuple[float, float, float, float],
    padding_ratio: float,
    target_aspect: float,
) -> Tuple[float, float, float, float]:
    """扩展边界框，并按海报宽高比补足范围。"""
    left, bottom, right, top = bbox
    center_lat = (bottom + top) / 2
    center_lon = (left + right) / 2

    width_deg = max(right - left, 0.002)
    height_deg = max(top - bottom, 0.002)

    width_deg *= 1 + padding_ratio * 2
    height_deg *= 1 + padding_ratio * 2

    width_m = width_deg * meters_per_degree_lon(center_lat)
    height_m = height_deg * 111320

    current_aspect = width_m / height_m if height_m > 0 else target_aspect

    if current_aspect > target_aspect:
        height_m = width_m / target_aspect
        height_deg = height_m / 111320
    else:
        width_m = height_m * target_aspect
        width_deg = width_m / max(meters_per_degree_lon(center_lat), 1)

    return (
        center_lon - width_deg / 2,
        center_lat - height_deg / 2,
        center_lon + width_deg / 2,
        center_lat + height_deg / 2,
    )


def get_edge_colors_by_type(graph, theme: dict[str, str]) -> List[str]:
    """按道路等级映射颜色。"""
    edge_colors: List[str] = []

    for _u, _v, data in graph.edges(data=True):
        highway = data.get("highway", "unclassified")

        if isinstance(highway, list):
            highway = highway[0] if highway else "unclassified"

        if highway in ["motorway", "motorway_link"]:
            color = theme["road_motorway"]
        elif highway in ["trunk", "trunk_link", "primary", "primary_link"]:
            color = theme["road_primary"]
        elif highway in ["secondary", "secondary_link"]:
            color = theme["road_secondary"]
        elif highway in ["tertiary", "tertiary_link"]:
            color = theme["road_tertiary"]
        elif highway in ["residential", "living_street", "unclassified"]:
            color = theme["road_residential"]
        else:
            color = theme["road_default"]

        edge_colors.append(color)

    return edge_colors


def get_edge_widths_by_type(graph) -> List[float]:
    """按道路等级映射线宽。"""
    edge_widths: List[float] = []

    for _u, _v, data in graph.edges(data=True):
        highway = data.get("highway", "unclassified")

        if isinstance(highway, list):
            highway = highway[0] if highway else "unclassified"

        if highway in ["motorway", "motorway_link"]:
            width = 0.75
        elif highway in ["trunk", "trunk_link", "primary", "primary_link"]:
            width = 0.6
        elif highway in ["secondary", "secondary_link"]:
            width = 0.45
        elif highway in ["tertiary", "tertiary_link"]:
            width = 0.33
        else:
            width = 0.21

        edge_widths.append(width)

    return edge_widths


def filter_polygon_features(features):
    """仅保留面几何。"""
    if features is None or features.empty:
        return None

    polygon_features = features[features.geometry.geom_type.isin(["Polygon", "MultiPolygon"])]
    if polygon_features.empty:
        return None

    return polygon_features


def split_bbox(
    bbox: Tuple[float, float, float, float],
    max_lon_span: float = MAX_TILE_LON_SPAN,
    max_lat_span: float = MAX_TILE_LAT_SPAN,
) -> List[Tuple[float, float, float, float]]:
    """将边界框对齐到固定全局网格后切分为若干小块。"""
    left, bottom, right, top = bbox
    aligned_left = align_grid_floor(left, max_lon_span, -180.0)
    aligned_right = align_grid_ceil(right, max_lon_span, -180.0)
    aligned_bottom = align_grid_floor(bottom, max_lat_span, -90.0)
    aligned_top = align_grid_ceil(top, max_lat_span, -90.0)

    cols = max(1, round((aligned_right - aligned_left) / max_lon_span))
    rows = max(1, round((aligned_top - aligned_bottom) / max_lat_span))

    tiles: List[Tuple[float, float, float, float]] = []

    for row in range(rows):
        for col in range(cols):
            tile_left = aligned_left + col * max_lon_span
            tile_right = min(tile_left + max_lon_span, 180.0)
            tile_bottom = aligned_bottom + row * max_lat_span
            tile_top = min(tile_bottom + max_lat_span, 90.0)
            tiles.append((tile_left, tile_bottom, tile_right, tile_top))

    return tiles


def align_grid_floor(value: float, step: float, origin: float) -> float:
    """将坐标向下对齐到固定全局网格。"""
    return origin + math.floor((value - origin) / step) * step


def align_grid_ceil(value: float, step: float, origin: float) -> float:
    """将坐标向上对齐到固定全局网格。"""
    return origin + math.ceil((value - origin) / step) * step


def format_bbox_token(bbox: Tuple[float, float, float, float]) -> str:
    """规范化边界框文本。"""
    left, bottom, right, top = bbox
    return f"{left:.6f}_{bottom:.6f}_{right:.6f}_{top:.6f}"


def build_cache_key(prefix: str, bbox: Tuple[float, float, float, float], extra: str = "") -> str:
    """生成稳定缓存键。"""
    raw_key = "|".join([CACHE_VERSION, prefix, extra, format_bbox_token(bbox)])
    return hashlib.sha1(raw_key.encode("utf-8")).hexdigest()[:16]


def get_road_cache_path(
    bbox: Tuple[float, float, float, float],
    network_type: str,
) -> Path:
    """获取道路网络缓存路径。"""
    cache_key = build_cache_key("road", bbox, network_type)
    return CACHE_ROADS_DIR / f"road_{network_type}_{cache_key}.graphml"


def get_feature_cache_path(
    bbox: Tuple[float, float, float, float],
    feature_name: str,
) -> Path:
    """获取地物缓存路径。"""
    cache_key = build_cache_key("feature", bbox, feature_name)
    return CACHE_FEATURES_DIR / f"{feature_name}_{cache_key}.geojson"


def create_cache_stats(total_tiles: int) -> dict[str, int]:
    """初始化缓存统计。"""
    return {
        "total": total_tiles,
        "hits": 0,
        "fetched": 0,
        "failed": 0,
    }


def print_cache_stats(label: str, stats: dict[str, int]):
    """打印缓存统计汇总。"""
    print_progress(
        f"{label}缓存统计: 命中 {stats['hits']}/{stats['total']}，"
        f"远程获取 {stats['fetched']}，失败 {stats['failed']}"
    )


def fetch_graph_for_bbox(
    bbox: Tuple[float, float, float, float],
    network_type: str,
):
    """按分块查询并合并道路网络。"""
    ensure_cache_dirs()
    tiles = split_bbox(bbox)
    merged_graph = None
    stats = create_cache_stats(len(tiles))

    for index, tile in enumerate(tiles, start=1):
        if len(tiles) > 1:
            print_progress(f"正在获取道路网络分块 {index}/{len(tiles)} ...")

        cache_path = get_road_cache_path(tile, network_type)

        if cache_path.exists():
            print_progress(f"道路网络分块 {index}/{len(tiles)} 命中缓存")
            graph = ox.load_graphml(cache_path)
            stats["hits"] += 1
        else:
            print_progress(f"道路网络分块 {index}/{len(tiles)} 未命中缓存，开始远程获取（可能较慢）")
            graph = None

            for attempt in range(1, ROAD_FETCH_RETRIES + 1):
                started_at = time.time()
                try:
                    graph = ox.graph_from_bbox(
                        tile,
                        network_type=network_type,
                        simplify=True,
                        retain_all=True,
                        truncate_by_edge=True,
                    )
                    elapsed = time.time() - started_at
                    print_progress(
                        f"道路网络分块 {index}/{len(tiles)} 远程获取完成，耗时 {elapsed:.1f} 秒"
                    )
                    break
                except Exception as error:
                    if attempt == ROAD_FETCH_RETRIES:
                        raise

                    print_progress(
                        f"道路网络分块 {index}/{len(tiles)} 获取失败，第 {attempt}/{ROAD_FETCH_RETRIES} 次重试: {error}"
                    )
                    time.sleep(ROAD_FETCH_RETRY_DELAY)

            if graph is None:
                raise ValueError(f"道路网络分块 {index}/{len(tiles)} 获取失败")

            ox.save_graphml(graph, cache_path)
            stats["fetched"] += 1

        if merged_graph is None:
            merged_graph = graph
        else:
            merged_graph = nx.compose(merged_graph, graph)
            del graph
            gc.collect()

    if merged_graph is None:
        raise ValueError("未获取到任何道路网络数据")

    print_cache_stats("道路网络", stats)
    return merged_graph


def fetch_features_for_bbox(
    bbox: Tuple[float, float, float, float],
    tags: dict[str, object],
    label: str,
    feature_name: str,
):
    """按分块查询并合并面状地物。"""
    ensure_cache_dirs()
    tiles = split_bbox(bbox)
    merged = None
    stats = create_cache_stats(len(tiles))

    for index, tile in enumerate(tiles, start=1):
        if len(tiles) > 1:
            print_progress(f"正在获取{label}分块 {index}/{len(tiles)} ...")

        cache_path = get_feature_cache_path(tile, feature_name)

        if cache_path.exists():
            print_progress(f"{label}分块 {index}/{len(tiles)} 命中缓存")
            features = gpd.read_file(cache_path)
            stats["hits"] += 1
            polygon_features = filter_polygon_features(features)
        else:
            print_progress(f"{label}分块 {index}/{len(tiles)} 未命中缓存，开始远程获取（可能较慢）")
            started_at = time.time()
            try:
                features = ox.features_from_bbox(tile, tags)
            except Exception as error:
                print_progress(f"{label}分块 {index}/{len(tiles)} 获取失败，已跳过: {error}")
                stats["failed"] += 1
                continue

            elapsed = time.time() - started_at
            print_progress(f"{label}分块 {index}/{len(tiles)} 远程获取完成，耗时 {elapsed:.1f} 秒")

            polygon_features = filter_polygon_features(features)

            if polygon_features is not None:
                polygon_features.to_file(cache_path, driver="GeoJSON")
                stats["fetched"] += 1
            else:
                continue

        if polygon_features is None:
            continue

        if merged is None:
            merged = polygon_features.copy()
        else:
            merged = gpd.GeoDataFrame(
                pd.concat([merged, polygon_features], ignore_index=True),
                geometry="geometry",
                crs=merged.crs,
            )

        del polygon_features
        gc.collect()

    if merged is None:
        print_cache_stats(label, stats)
        return None

    dedup_columns = [column for column in ["element", "id"] if column in merged.columns]
    if dedup_columns:
        merged = merged.drop_duplicates(subset=dedup_columns)

    if merged.empty:
        print_cache_stats(label, stats)
        return None

    print_cache_stats(label, stats)
    return merged


def render_poster(
    tracks: List[List[Tuple[float, float]]],
    output_path: str,
    theme_name: str,
    network_type: str,
    width: float,
    height: float,
    track_width: float,
    track_opacity: float,
    padding_ratio: float,
    query_padding_ratio: float,
    memory_log_path: str | None,
) -> dict[str, object]:
    """生成艺术地图海报。"""
    theme = THEMES[theme_name]
    themed_output_path = build_output_path_with_theme(output_path, theme_name)
    Path(themed_output_path).expanduser().parent.mkdir(parents=True, exist_ok=True)
    raw_bbox = calculate_bounds(tracks)
    render_bbox = expand_bbox(raw_bbox, padding_ratio, width / height)
    effective_query_padding_ratio = max(query_padding_ratio, padding_ratio)
    query_bbox = expand_bbox(raw_bbox, effective_query_padding_ratio, width / height)
    left, bottom, right, top = render_bbox
    center_point = ((bottom + top) / 2, (left + right) / 2)

    ox.settings.use_cache = True
    ox.settings.log_console = False
    ox.settings.requests_timeout = 180

    log_memory("开始渲染前", memory_log_path)
    print_progress("正在获取道路网络，首次生成或新区域可能需要较长时间...")
    graph = fetch_graph_for_bbox(query_bbox, network_type)
    log_memory("道路网络获取完成", memory_log_path)
    graph_proj = ox.project_graph(graph)
    del graph
    gc.collect()
    log_memory("道路网络投影完成", memory_log_path)

    print_progress("正在获取水域与绿地区域，首次生成或新区域可能需要较长时间...")
    water = fetch_features_for_bbox(query_bbox, WATER_TAGS, "水域", "water")
    log_memory("水域数据获取完成", memory_log_path)
    parks = fetch_features_for_bbox(query_bbox, PARK_TAGS, "绿地", "parks")
    log_memory("绿地数据获取完成", memory_log_path)

    if water is not None:
        water = ox.projection.project_gdf(water, to_crs=graph_proj.graph["crs"])
        gc.collect()
        log_memory("水域投影完成", memory_log_path)

    if parks is not None:
        parks = ox.projection.project_gdf(parks, to_crs=graph_proj.graph["crs"])
        gc.collect()
        log_memory("绿地投影完成", memory_log_path)

    fig, ax = plt.subplots(figsize=(width, height), dpi=300)
    fig.patch.set_facecolor(theme["bg"])
    ax.set_facecolor(theme["bg"])
    log_memory("画布初始化完成", memory_log_path)

    if water is not None:
        water.plot(ax=ax, facecolor=theme["water"], edgecolor="none", zorder=0.4)

    if parks is not None:
        parks.plot(ax=ax, facecolor=theme["parks"], edgecolor="none", zorder=0.6)

    edge_colors = get_edge_colors_by_type(graph_proj, theme)
    edge_widths = get_edge_widths_by_type(graph_proj)
    log_memory("道路样式数据准备完成", memory_log_path)

    ox.plot_graph(
        graph_proj,
        ax=ax,
        bgcolor=theme["bg"],
        node_size=0,
        edge_color=edge_colors,
        edge_linewidth=edge_widths,
        edge_alpha=1.0,
        show=False,
        close=False,
    )
    log_memory("道路网络绘制完成", memory_log_path)

    transformer = Transformer.from_crs("EPSG:4326", graph_proj.graph["crs"], always_xy=True)
    left_x, bottom_y = transformer.transform(left, bottom)
    right_x, top_y = transformer.transform(right, top)

    for track in tracks:
        lons = [lon for _, lon in track]
        lats = [lat for lat, _ in track]
        xs, ys = transformer.transform(lons, lats)
        ax.plot(
            xs,
            ys,
            color=TRACK_COLOR,
            linewidth=track_width,
            alpha=track_opacity,
            zorder=9,
            solid_capstyle="round",
            solid_joinstyle="round",
        )

    ax.set_xlim(min(left_x, right_x), max(left_x, right_x))
    ax.set_ylim(min(bottom_y, top_y), max(bottom_y, top_y))
    ax.set_aspect("equal", adjustable="box")
    ax.set_axis_off()

    log_memory("轨迹绘制完成", memory_log_path)
    plt.savefig(themed_output_path, dpi=300, bbox_inches="tight", pad_inches=0)
    plt.close(fig)
    del graph_proj
    gc.collect()
    log_memory("图片保存完成", memory_log_path)

    return {
        "success": True,
        "theme": theme_name,
        "track_count": len(tracks),
        "bbox": {
            "left": left,
            "bottom": bottom,
            "right": right,
            "top": top,
        },
        "query_bbox": {
            "left": query_bbox[0],
            "bottom": query_bbox[1],
            "right": query_bbox[2],
            "top": query_bbox[3],
        },
        "center": {
            "latitude": center_point[0],
            "longitude": center_point[1],
        },
        "output_path": themed_output_path,
    }


def main():
    """命令行入口。"""
    parser = argparse.ArgumentParser(description="根据 FIT 轨迹生成艺术地图海报原型")
    parser.add_argument(
        "input_path",
        nargs="?",
        default=str(DEFAULT_INPUT_PATH),
        help="FIT 输入路径，默认使用 public/fit_files",
    )
    parser.add_argument(
        "output_path",
        nargs="?",
        default=str(DEFAULT_OUTPUT_DIR),
        help="输出图片路径或目录，默认写入 public/outputs",
    )
    parser.add_argument(
        "--theme",
        choices=sorted(THEMES.keys()),
        default=DEFAULT_THEME,
        help="海报主题",
    )
    parser.add_argument(
        "--network-type",
        choices=["all", "all_public", "bike", "drive", "drive_service", "walk"],
        default=DEFAULT_NETWORK_TYPE,
        help="OSM 路网类型",
    )
    parser.add_argument("--width", type=float, default=DEFAULT_WIDTH, help="海报宽度（英寸）")
    parser.add_argument("--height", type=float, default=DEFAULT_HEIGHT, help="海报高度（英寸）")
    parser.add_argument(
        "--track-width",
        type=float,
        default=DEFAULT_TRACK_WIDTH,
        help="轨迹叠加线宽",
    )
    parser.add_argument(
        "--track-opacity",
        type=float,
        default=DEFAULT_TRACK_OPACITY,
        help="轨迹叠加透明度",
    )
    parser.add_argument(
        "--padding-ratio",
        type=float,
        default=DEFAULT_PADDING,
        help="边界框扩展比例",
    )
    parser.add_argument(
        "--query-padding-ratio",
        type=float,
        default=DEFAULT_QUERY_PADDING,
        help="地图数据查询范围扩展比例，默认固定为 0.18 以便复用缓存",
    )
    parser.add_argument("--gps-cache", type=str, default=None, help="GPS 数据缓存 JSON 路径")
    parser.add_argument(
        "--memory-log",
        type=str,
        default=str(DEFAULT_MEMORY_LOG_PATH),
        help="内存日志输出路径，默认写入 cache/poster_memory.log",
    )

    args = parser.parse_args()

    try:
        fit_files = resolve_fit_files(args.input_path)
        resolved_output_path = resolve_output_path(args.output_path)

        if not fit_files:
            print(
                json.dumps(
                    {"success": False, "error": "输入路径中没有可用的 FIT 文件"}, ensure_ascii=False
                )
            )
            sys.exit(1)

        print_progress(f"开始生成艺术地图海报，共 {len(fit_files)} 个 FIT 文件")
        gps_cache = load_gps_cache(args.gps_cache) if args.gps_cache else None
        tracks = collect_tracks(fit_files, gps_cache)

        if not tracks:
            print(
                json.dumps(
                    {"success": False, "error": "没有可用的轨迹 GPS 数据"}, ensure_ascii=False
                )
            )
            sys.exit(1)

        print_progress(f"成功提取 {len(tracks)} 条轨迹，准备绘制艺术地图...")
        result = render_poster(
            tracks=tracks,
            output_path=resolved_output_path,
            theme_name=args.theme,
            network_type=args.network_type,
            width=args.width,
            height=args.height,
            track_width=args.track_width,
            track_opacity=args.track_opacity,
            padding_ratio=args.padding_ratio,
            query_padding_ratio=args.query_padding_ratio,
            memory_log_path=args.memory_log,
        )
        print(json.dumps(result, ensure_ascii=False))
    except Exception as error:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": str(error),
                    "stack": traceback.format_exc(),
                },
                ensure_ascii=False,
            )
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
