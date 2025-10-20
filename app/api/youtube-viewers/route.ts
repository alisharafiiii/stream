import { NextResponse } from 'next/server'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    
    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 })
    }
    
    if (!YOUTUBE_API_KEY) {
      console.log('YouTube API key not configured')
      return NextResponse.json({ viewers: 0 })
    }
    
    // YouTube Data API v3 - Get video details including live streaming details
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    )
    
    if (!response.ok) {
      console.error('YouTube API error:', response.statusText)
      return NextResponse.json({ viewers: 0 })
    }
    
    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      const liveDetails = data.items[0].liveStreamingDetails
      const concurrentViewers = liveDetails?.concurrentViewers || 0
      
      return NextResponse.json({ 
        viewers: parseInt(concurrentViewers),
        isLive: !!liveDetails?.actualStartTime && !liveDetails?.actualEndTime
      })
    }
    
    return NextResponse.json({ viewers: 0, isLive: false })
  } catch (error) {
    console.error('Failed to fetch YouTube viewers:', error)
    return NextResponse.json({ viewers: 0, isLive: false })
  }
}
