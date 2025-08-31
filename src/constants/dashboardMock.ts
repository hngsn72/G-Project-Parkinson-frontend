// constants/dashboardMock.ts
export const dashboardMock = {
  total_analyses: 247,
  total_high_risk: 24,
  total_medium_risk: 65,
  total_low_risk: 158,
  accuracy_rate: 94.2,
  recent_analyses: [
    { 
      id: 'A001', 
      session_id: 'sess001',
      timestamp: '2024-08-10T07:30:00Z',
      created_at: '2024-08-10T07:30:00Z',
      prediction: 'Parkinsons',
      confidence: 0.87, 
      risk_level: 'high',
      audio_duration: 15.5,
      sentence_used: 'The quick brown fox jumps over the lazy dog'
    },
    { 
      id: 'A002', 
      session_id: 'sess002',
      timestamp: '2024-08-10T06:15:00Z',
      created_at: '2024-08-10T06:15:00Z',
      prediction: 'Healthy',
      confidence: 0.94, 
      risk_level: 'low',
      audio_duration: 12.3,
      sentence_used: 'She sells seashells by the seashore'
    },
    { 
      id: 'A003', 
      session_id: 'sess003',
      timestamp: '2024-08-10T05:00:00Z',
      created_at: '2024-08-10T05:00:00Z',
      prediction: 'Parkinsons',
      confidence: 0.91, 
      risk_level: 'moderate',
      audio_duration: 18.7,
      sentence_used: 'Pack my box with five dozen liquor jugs'
    },
    { 
      id: 'A004', 
      session_id: 'sess004',
      timestamp: '2024-08-09T22:30:00Z',
      created_at: '2024-08-09T22:30:00Z',
      prediction: 'Healthy',
      confidence: 0.89, 
      risk_level: 'low',
      audio_duration: 14.2,
      sentence_used: 'How vexingly quick daft zebras jump'
    },
  ]
};
