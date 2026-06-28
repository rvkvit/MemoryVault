'use client'

import { Linkedin, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

export function StayConnected() {
  const linkedIn = process.env.NEXT_PUBLIC_LINKEDIN_URL

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mt-6 space-y-4"
    >
      <p className="text-body-s text-[rgba(255,255,255,0.55)]">Stay Connected</p>

      <div className="flex flex-wrap gap-3">
        <a
          href="mailto:rvk.vit@gmail.com"
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] text-body-s text-[rgba(255,255,255,0.70)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[rgba(255,255,255,0.90)] transition-all"
        >
          <Mail className="w-4 h-4" />
          rvk.vit@gmail.com
        </a>

        {linkedIn && (
          <a
            href={linkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] text-body-s text-[rgba(255,255,255,0.70)] hover:bg-[rgba(255,255,255,0.07)] hover:text-[rgba(255,255,255,0.90)] transition-all"
          >
            <Linkedin className="w-4 h-4" />
            LinkedIn
          </a>
        )}
      </div>
    </motion.div>
  )
}
