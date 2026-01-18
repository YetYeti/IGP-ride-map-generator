export const MapStyles = {
  default: 'default',
  cartodb_positron: 'cartodb_positron',
  cartodb_positron_nolabels: 'cartodb_positron_nolabels',
  cartodb_darkmatter: 'cartodb_darkmatter',
  cartodb_darkmatter_nolabels: 'cartodb_darkmatter_nolabels',
} as const

export type MapStyle = (typeof MapStyles)[keyof typeof MapStyles]

export const MapStyleLabels: Record<MapStyle, string> = {
  default: '默认样式',
  cartodb_positron: '浅色地图（含标签）',
  cartodb_positron_nolabels: '浅色地图（无标签）',
  cartodb_darkmatter: '深色地图（含标签）',
  cartodb_darkmatter_nolabels: '深色地图（无标签）',
}
