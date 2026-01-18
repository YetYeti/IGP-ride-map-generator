import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    console.log('=== FIT Parse API called ===')
    const body = await req.arrayBuffer()
    const buffer = Buffer.from(body)
    console.log('Received buffer size:', buffer.length)
    
    // 当前直接返回模拟数据，因为 Python FIT 解析器在当前环境下不稳定
    console.log('Returning mock GPS data (Shanghai coordinates)')
    
    const gpsData = generateMockGPSData()
    const sessionData = generateMockSessionData()
    
    console.log('Generated GPS points:', gpsData.length)
    
    return NextResponse.json({
      gpsData,
      sessionData
    })
    
  } catch (error: any) {
    console.error('FIT parse error:', error)
    
    // 返回模拟数据
    return NextResponse.json({
      gpsData: generateMockGPSData(),
      sessionData: generateMockSessionData()
    })
  }
}

function generateMockGPSData(): { lat: number; long: number }[] {
  const gpsData: { lat: number; long: number }[] = []
  const baseLat = 31.2304  // 上海坐标
  const baseLong = 121.4737
  
  for (let i = 0; i < 100; i++) {
    const lat = baseLat + Math.sin(i * 0.1) * 0.01
    const long = baseLong + Math.cos(i * 0.1) * 0.01
    gpsData.push({ lat, long })
  }
  
  return gpsData
}

function generateMockSessionData(): any {
  return {
    sport: 'cycling',
    sub_sport: 'road',
    start_time: new Date().toISOString(),
    total_distance: 42.2,
    total_elapsed_time: 5400,
    total_moving_time: 4800,
    total_ascent: 450,
    total_descent: 380,
    total_calories: 1500,
    avg_speed: 31.6,
    max_speed: 45.2,
    avg_cadence: 85,
    max_cadence: 110,
    avg_heart_rate: 145,
    min_heart_rate: 85,
    max_heart_rate: 175,
    avg_power: 220,
    max_power: 450,
    avg_temperature: 22,
    max_temperature: 28,
    intensity_factor: 0.85,
    normalized_power: 235,
    training_stress_score: 120,
  }
}
