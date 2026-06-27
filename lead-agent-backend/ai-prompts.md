# AI prompts (optional layer) + Arabic outreach

The **scoring engine is deterministic and free** (`scoring/leadScoring.js`) — you do NOT
need an API key to rank leads. These prompts are an *optional* upgrade for nuance and for
generating per-owner Arabic messages, exactly as the spec describes.

---

## 1. Lead scoring prompt (optional AI second opinion)
Use the Claude API (`claude-sonnet-4-6` is a good price/quality fit) only if you later want
AI to re-rank borderline leads. Feed one lead at a time:

```
You are scoring real estate owner leads in Ajman, UAE. Score 1 (cold) to 10 (hot).

Score HIGHER if: listed 30+ days ago; phone on 2+ listings; WHOLE building or villa;
direct owner (not agency); area in Al Nuaimiya / Al Rashidiya / Al Rumailah / Al Rawda;
competitive price; language suggests they're tired of managing it.

Score LOWER if: posted by a known agency; brand new (<3 days); single small unit;
outside target areas.

Input lead data:
{lead_json}

Return ONLY JSON: {"score": X, "reason": "..."}
```

---

## 2. Arabic WhatsApp outreach (Gulf-friendly, from the spec)
Pre-generate this into the `arabicMessage` column so you can copy-paste per owner.
Keep it polite, professional, **Gulf-friendly — avoid Levantine slang** (spec §11).

**Template (fill `[اسم الشركة]` with your company name):**
```
السلام عليكم ورحمة الله. معك [اسم الشركة]، متخصصون في إدارة وتأجير العقارات السكنية في عجمان.
لاحظنا أن لديكم عقارًا معروضًا للإيجار. نوفّر خدمة استئجار المبنى بالكامل بعقد طويل الأمد،
وندفع لكم إيجارًا شهريًا مضمونًا، ونتكفّل بكل شيء — المستأجرين والصيانة والفواتير.
هل تسمحون لنا بالاتصال لشرح التفاصيل؟ شكرًا لكم.
```

**English (for your records):**
> Peace be upon you. I'm from [Company Name], specializing in residential building
> management in Ajman. We noticed you have a property for rent. We offer to lease the
> entire building under a long-term contract, paying you guaranteed monthly rent, while we
> handle everything — tenants, maintenance, bills. May we call to explain? Thank you.

---

## 3. Signboard / under-construction OCR prompt (spec §5 & §6)
For photos you upload to a Drive folder, run Claude vision (or Google Vision) with:

```
Extract from this UAE building signboard photo, as JSON:
{ "phones": [], "ownerOrDeveloper": "", "contractor": "", "buildingName": "",
  "status": "under_construction | completed | unknown" }
Return ONLY the JSON. If a field is unreadable, use "".
```
Then add each result to the Master Sheet with `source = field_photo` (+2 score bonus) and,
for under-construction sites, set `status = UNDER_CONSTRUCTION` and a follow-up reminder
2 months before expected completion.
