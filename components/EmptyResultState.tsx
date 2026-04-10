export function EmptyResultState() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="space-y-3">
        <div className="aspect-square rounded-md border border-dashed border-gray-300 bg-gray-50" />
        <div className="aspect-[4/3] rounded-md border border-dashed border-gray-300 bg-gray-50" />
      </div>
      <div className="space-y-3">
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-medium text-gray-900">轨迹叠加网页</div>
          <p className="mt-1 text-sm text-gray-600">
            适合交互查看不同地图样式。
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-medium text-gray-900">轨迹合成图</div>
          <p className="mt-1 text-sm text-gray-600">
            适合导出和分享的静态图。
          </p>
        </div>
      </div>
    </div>
  )
}
