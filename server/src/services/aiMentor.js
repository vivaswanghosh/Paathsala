import fetch from 'node-fetch'
import OpenAI from 'openai'

// Initialize OpenAI (or Groq) using environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
})

const REALTIME_KEYWORDS = [
  'latest', 'recent', 'current', 'today', 'news', '2024', '2025',
  'update', 'now', 'trending', 'new', 'latest research', 'this year',
  'this month', 'this week', 'recently', 'just released'
]

export async function chatWithMentor(query, history = []) {
  const needsWebSearch = REALTIME_KEYWORDS.some(kw =>
    query.toLowerCase().includes(kw)
  )

  let webResults = []
  let curatedResults = []

  if (needsWebSearch) {
    webResults = await searchWeb(query)
  }

  curatedResults = await searchCuratedResources(query)

  const context = buildContext(webResults, curatedResults)

  const messages = [
    {
      role: 'system',
      content: `You are an AI Mentor for college students. Provide helpful, educational responses.
      Be concise but thorough. Use examples when helpful.
      ${context ? `\n\nUse this context if relevant:\n${context}` : ''}
      When using sources, cite them by number like [1], [2], etc.`
    },
    ...history.slice(-10).map(m => ({
      role: m.role,
      content: m.content
    })),
    { role: 'user', content: query }
  ]

  try {
    // Use Llama 3 if on Groq, otherwise fallback to GPT-4o
    // You can change 'llama3-8b-8192' to 'mixtral-8x7b-32768' if you want a bigger model
    const modelToUse = process.env.OPENAI_BASE_URL ? 'llama-3.1-8b-instant' : 'gpt-4o';


    const response = await openai.chat.completions.create({
      model: modelToUse,
      messages,
      max_tokens: 1500,
      temperature: 0.7
    })

    const answer = response.choices[0].message.content
    const sources = extractSources(answer, webResults, curatedResults)

    return {
      answer,
      sources,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('AI Mentor error:', error)
    return {
      answer: "I'm currently unable to connect to my intelligence service. Please check the API configuration or try again later.",
      sources: [],
      timestamp: new Date().toISOString()
    }
  }
}

async function searchWeb(query) {
  try {
    if (!process.env.SERP_API_KEY) {
      return []
    }

    const response = await fetch(
      `https://serpapi.com/search?q=${encodeURIComponent(query + ' educational')}&api_key=${process.env.SERP_API_KEY}&num=5`
    )

    const data = await response.json()

    return (data.organic_results || []).slice(0, 5).map(r => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet
    }))
  } catch (error) {
    console.error('Web search error:', error)
    return []
  }
}

async function searchCuratedResources(query) {
  return []
}

function buildContext(webResults, curatedResults) {
  let context = ''

  if (webResults.length > 0) {
    context += '\n### Web Search Results:\n'
    webResults.forEach((r, i) => {
      context += `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}\n\n`
    })
  }

  if (curatedResults.length > 0) {
    context += '\n### Curated Educational Resources:\n'
    curatedResults.forEach((r, i) => {
      context += `[C${i + 1}] ${r.title}\n${r.description}\nURL: ${r.url}\n\n`
    })
  }

  return context
}

function extractSources(answer, webResults, curatedResults) {
  const sources = []

  const sourcePattern = /\[(\d+)\]/g
  let match
  while ((match = sourcePattern.exec(answer)) !== null) {
    const index = parseInt(match[1]) - 1
    if (webResults[index]) {
      sources.push({
        title: webResults[index].title,
        url: webResults[index].url
      })
    }
  }

  return [...new Map(sources.map(s => [s.url, s])).values()]
}
