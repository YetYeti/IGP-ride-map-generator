export interface Activity {
  RideId: number
  MemberId: number
  Title: string
  sport: string
  sub_sport: string
  start_time: Date
  total_ascent: number
  total_descent: number
  total_calories: number
  total_distance: number
  total_elapsed_time: number
  total_moving_time: number
  avg_cadence: number
  max_cadence: number
  avg_heart_rate: number
  min_heart_rate: number
  max_heart_rate: number
  avg_power: number
  max_power: number
  avg_speed: number
  max_speed: number
  avg_temperature: number
  max_temperature: number
  intensity_factor: number
  normalized_power: number
  training_stress_score: number
}
