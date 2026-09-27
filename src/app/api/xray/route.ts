import { NextResponse } from "next/server"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const { word } = await req.json()

    // Dịch từ vựng bằng Google Translate API Miễn Phí
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(word)}`
    const transRes = await fetch(translateUrl)
    const transData = await transRes.json()
    const contextualMeaning = transData?.[0]?.[0]?.[0] || "Không tìm thấy nghĩa"

    // Tra phiên âm và ví dụ từ Free Dictionary API
    const dictUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    const dictRes = await fetch(dictUrl)
    let phonetics = ""
    let collocations: string[] = []

    if (dictRes.ok) {
      const dictData = await dictRes.json()
      phonetics = dictData[0]?.phonetic || dictData[0]?.phonetics?.[0]?.text || ""

      const meanings = dictData[0]?.meanings || []
      meanings.forEach((m: any) => {
        m.definitions?.forEach((d: any) => {
          if (d.example) collocations.push(d.example)
        })
      })
    }

    return NextResponse.json(
      {
        contextual_meaning: contextualMeaning,
        phonetic: phonetics,
        collocations: collocations.slice(0, 3)
      },
      { headers: corsHeaders }
    )
  } catch (error) {
    return NextResponse.json({ error: "Lỗi tra cứu" }, { status: 500, headers: corsHeaders })
  }
}