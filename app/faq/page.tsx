import Link from "next/link"
import { PawPrint, ChevronRight } from "lucide-react"

// ---------------------------------------------------------------------------
// FAQ data — hardcoded, no database required (Story 34)
// ---------------------------------------------------------------------------

const FAQS = [
  {
    q: "How do I apply to adopt an animal?",
    a: "Browse our available animals on the homepage and click on any animal to view their profile. Each animal's page has an 'Apply to Adopt' button. Fill in your details and submit — our team will be in touch within a few business days.",
  },
  {
    q: "Who can adopt from Foster Connect?",
    a: "Any adult (18+) with a stable home environment is welcome to apply. We assess each application individually. We do not have breed or size restrictions on housing, but we do consider how our animals' personalities will fit your household.",
  },
  {
    q: "What does a home check involve?",
    a: "A home check is a brief, informal visit by one of our adoption counselors to ensure the environment is safe and appropriate for the specific animal. We look at fencing, space, and how other pets or family members interact. Most home checks take under 30 minutes.",
  },
  {
    q: "What happens after the Meet & Greet?",
    a: "After the Meet & Greet, your adoption counselor writes a recommendation. Our Rescue Lead reviews the full application, the counselor's notes, and any medical alerts before making a final approval or denial decision. You will be notified by email either way.",
  },
  {
    q: "What does a Critical Medical Alert mean for prospective adopters?",
    a: "A Critical Medical Alert means an animal has an unresolved health concern flagged by our medical team or foster parent. Adoption approvals are paused until the alert is resolved. This protects you from unexpected medical costs and ensures every animal is placed in stable health.",
  },
  {
    q: "What is your return policy?",
    a: "We accept returns at any time, no questions asked. We would rather have an animal returned to us than placed in an unsuitable home. If your circumstances change after adoption, please contact us and we will arrange a safe handover.",
  },
  {
    q: "How long does the adoption process take?",
    a: "The timeline varies by application volume, but most applicants move from submission to decision within 2–4 weeks. The Meet & Greet is typically scheduled within one week of your application being moved to review. You can check your application status at any time using our status lookup tool.",
  },
  {
    q: "Are there adoption fees?",
    a: "Yes — adoption fees help cover the cost of veterinary care, food, and transport during an animal's time in foster care. Fees vary by species and medical history. The exact fee is confirmed during the application review stage before any commitment is required.",
  },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 text-blue-600 font-semibold">
            <PawPrint className="w-5 h-5" />
            <span className="text-slate-900">Foster Connect</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/application-status"
              className="text-sm text-slate-600 hover:text-blue-600 transition-colors"
            >
              Check application status
            </Link>
            <Link
              href="/faq"
              className="text-sm text-blue-600 font-medium"
              aria-current="page"
            >
              FAQ
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-slate-500">
          Everything you need to know about adopting from Foster Connect.
        </p>
      </section>

      {/* FAQ list */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 space-y-4">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-5">
            <h2 className="text-base font-semibold text-slate-900 flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              {faq.q}
            </h2>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed pl-6">
              {faq.a}
            </p>
          </div>
        ))}

        {/* CTA */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-6 text-center space-y-3">
          <p className="text-sm font-medium text-blue-900">
            Still have questions? Browse our available animals and start the process.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            See available animals
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Foster Connect · All rights reserved
      </footer>
    </div>
  )
}
