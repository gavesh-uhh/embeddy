"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Zap,
  Sparkles,
  Cpu,
  ArrowRight,
  HelpCircle,
  Plus,
  ArrowLeft,
  X,
} from "lucide-react";
import Image from "next/image";

interface FAQItem {
  question: string;
  answer: string;
}

export default function PricingPage() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(true);
  const [activeFaq, setActiveFAQ] = useState<number | null>(null);

  const plans = [
    {
      id: "silicon",
      name: "Silicon",
      description: "Solid, abundant, and foundational. Ideal for students and hobbyists.",
      priceMonthly: 0,
      priceYearly: 0,
      badge: "FOUNDATIONAL",
      icon: Cpu,
      color: "var(--text-muted)",
      glowColor: "rgba(255, 255, 255, 0.02)",
      features: [
        "5 hardware workspace designs per month",
        "Signal-typed hardware pinout mapping",
        "Interactive schematic canvas visualizer",
        "20-segment LED power load analysis",
        "Standard Bill of Materials list",
        "Community support & documentation access",
      ],
      notIncluded: [
        "Professional KiCad schematic exports",
        "Sandboxed Wokwi firmware simulations",
        "Datasheet PDF parsing (limited to standard)",
        "Priority multi-agent pipelines (under 15s)",
        "Dedicated expert engineering review",
      ],
      actionText: "Get Started Free",
      popular: false,
    },
    {
      id: "germanium",
      name: "Germanium",
      description: "Highly conductive and responsive. Optimized for pro engineers and startup squads.",
      priceMonthly: 24,
      priceYearly: 19,
      badge: "MOST CONDUCTIVE",
      icon: Zap,
      color: "var(--accent)",
      glowColor: "rgba(0, 255, 102, 0.1)",
      features: [
        "Unlimited hardware workspace designs",
        "KiCad schematic exports (.kicad_sch)",
        "Embedded sandboxed Wokwi runtime simulator",
        "S-expression netlist outputs",
        "Priority agent scheduling (generates in <15s)",
        "Large datasheet PDF uploads (up to 10MB)",
        "Full voltage conflict & fault audit logs",
        "1-on-1 priority engineer email support",
      ],
      notIncluded: [
        "Private footprint catalog integrations",
        "DigiKey/Mouser automated ERP procurement",
        "Multi-member organization accounts",
        "99.9% uptime SLA guarantees",
      ],
      actionText: "Upgrade to Germanium",
      popular: true,
    },
    {
      id: "graphene",
      name: "Graphene",
      description: "Zero-resistance atomic lattice. Created for full scale engineering organizations.",
      priceMonthly: 99,
      priceYearly: 79,
      badge: "ULTRA CONDUCTIVE",
      icon: Sparkles,
      color: "var(--accent-blue)",
      glowColor: "rgba(56, 189, 248, 0.15)",
      features: [
        "Everything in Germanium, plus:",
        "Shared multi-user teams & synced worktrees",
        "DigiKey & Mouser ERP live procurement checkouts",
        "Custom private footprint & library uploads",
        "Dedicated isolated AI Agent processing pools",
        "Enterprise CAD API access for CI/CD pipelines",
        "99.9% system uptime SLA contract guarantees",
        "Dedicated hardware engineer account manager",
      ],
      notIncluded: [],
      actionText: "Deploy Graphene",
      popular: false,
    },
  ];

  const faqs: FAQItem[] = [
    {
      question: "Can I export my designs into professional electronics CAD softwares?",
      answer: "Absolutely! Germanium and Graphene tiers allow you to export high-precision schematic designs directly into standard s-expression KiCad format (.kicad_sch), enabling native circuit manipulation immediately.",
    },
    {
      question: "What microcontrollers does Embeddy fully support?",
      answer: "Embeddy provides high-fidelity, signal-typed layouts for the Arduino Uno/Mega, ESP32, ESP32-S3, STM32F103, and STM32F4 series out of the box, with options for custom board types under Graphene.",
    },
    {
      question: "How do your parallel AI agent pipelines function?",
      answer: "Embeddy orchestrates 9 specialized agents in parallel (BOM compilations, Pin routing, Power budgets, Safety audits, and firmware generation). High priority Germanium processing guarantees your designs finish in under 15 seconds.",
    },
    {
      question: "Is there a student or academic research discount?",
      answer: "Yes! We heavily support educational projects and hardware research labs. Please send us a message through your university email for a free academic upgrade.",
    },
    {
      question: "Can I cancel my membership or switch plans easily?",
      answer: "Yes, you can cancel, upgrade, or downgrade your plan directly from your settings panel at any time. There are no locking contracts or early termination fees.",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden relative"
      style={{
        background: "var(--bg)",
        backgroundImage: `
          linear-gradient(rgba(0, 255, 102, 0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 255, 102, 0.015) 1px, transparent 1px)
        `,
        backgroundSize: "64px 64px",
      }}
    >
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full filter blur-[150px] opacity-25 pointer-events-none" style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }} />
      <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full filter blur-[150px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, var(--accent-blue) 0%, transparent 70%)" }} />

      {/* Navigation */}
      <nav
        className="flex-shrink-0 flex items-center justify-between px-8 py-3 border-b sticky top-0 z-50 backdrop-blur-md"
        style={{ borderColor: "var(--border)", background: "rgba(5, 5, 5, 0.8)" }}
      >
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2.5 bg-transparent border-0 text-left cursor-pointer group"
          aria-label="Back to dashboard logo"
        >
          <div className="w-7 h-7 rounded-lg border border-[#00ff6630] bg-[#050505] shadow-[0_0_12px_rgba(0,255,102,0.15)] flex items-center justify-center p-0.5 group-hover:border-[#00ff6670] transition-colors">
            <Image
              src="/icon.png"
              alt="Embeddy"
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <span
            className="font-bold text-sm tracking-tight group-hover:text-[var(--accent)] transition-colors"
            style={{
              fontFamily: "Outfit, sans-serif",
              color: "var(--text-primary)",
            }}
          >
            Embeddy
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded font-bold"
            style={{
              background: "#00ff6610",
              color: "var(--accent)",
              border: "1px solid #00ff6620",
              letterSpacing: "0.08em",
            }}
          >
            BETA
          </span>
        </button>

        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
            color: "var(--text-primary)",
          }}
          aria-label="Back to workspace dashboard"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.boxShadow = "0 0 10px rgba(0, 255, 102, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <ArrowLeft size={12} aria-hidden="true" />
          Back to Workspace
        </button>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col items-center relative z-10">
        {/* Header Section */}
        <div className="text-center max-w-2xl mb-12 md:mb-16 fade-up">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest mb-4 border"
            style={{
              borderColor: "rgba(0, 255, 102, 0.2)",
              background: "rgba(0, 255, 102, 0.05)",
              color: "var(--accent)",
            }}
          >
            <Sparkles size={10} aria-hidden="true" />
            HI-FI ELECTRONICS GENERATION
          </div>
          <h1
            className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4"
            style={{
              fontFamily: "Outfit, sans-serif",
              color: "var(--text-primary)",
              lineHeight: "1.15",
            }}
          >
            Conductive Pricing for <br />
            <span style={{ color: "var(--accent)" }}>Professional Creators</span>
          </h1>
          <p className="text-xs md:text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Supercharge your hardware design lifecycle. Choose the atomic conductivity and intelligence throughput your engineering workflow demands.
          </p>

          {/* Billing Switcher */}
          <div className="flex items-center justify-center gap-3.5 mt-8 md:mt-10">
            <span
              className="text-xs font-semibold transition-colors"
              style={{ color: !isYearly ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              Billed Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              aria-label="Toggle annual and monthly billing plans"
              className="w-12 h-6 rounded-full p-0.5 cursor-pointer flex items-center transition-colors border"
              style={{
                background: "rgba(0, 255, 102, 0.04)",
                borderColor: "var(--border-bright)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full transition-transform duration-300"
                style={{
                  background: "var(--accent)",
                  transform: isYearly ? "translateX(24px)" : "translateX(0px)",
                  boxShadow: "0 0 10px var(--accent)",
                }}
              />
            </button>
            <span
              className="text-xs font-semibold flex items-center gap-1.5 transition-colors"
              style={{ color: isYearly ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              Billed Annually
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                style={{
                  background: "var(--accent-green-glow)",
                  color: "var(--accent)",
                  border: "1px solid rgba(0, 255, 102, 0.2)",
                }}
              >
                SAVE 20%
              </span>
            </span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mb-20">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;
            return (
              <div
                key={plan.id}
                className="relative rounded-2xl border p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:translate-y-[-6px]"
                style={{
                  borderColor: plan.popular ? "rgba(0, 255, 102, 0.3)" : "var(--border)",
                  background: "rgba(10, 10, 10, 0.85)",
                  boxShadow: plan.popular
                    ? "0 10px 40px -15px rgba(0, 255, 102, 0.15), inset 0 0 32px rgba(0, 255, 102, 0.015)"
                    : "0 10px 30px -15px rgba(0,0,0,0.5)",
                }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute top-0 right-6 translate-y-[-50%]">
                    <span
                      className="text-[9px] font-extrabold tracking-widest px-3 py-1 rounded-full border shadow-[0_0_15px_rgba(0,255,102,0.2)]"
                      style={{
                        background: "var(--accent)",
                        color: "#000",
                        borderColor: "rgba(0,255,102,0.6)",
                      }}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Title & Icon Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3
                        className="text-xl font-bold tracking-tight"
                        style={{ fontFamily: "Outfit, sans-serif", color: "var(--text-primary)" }}
                      >
                        {plan.name}
                      </h3>
                      {!plan.popular && plan.badge && (
                        <span
                          className="text-[8px] font-bold tracking-widest mt-0.5 inline-block"
                          style={{ color: plan.color }}
                        >
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <div
                      className="w-10 h-10 rounded-xl border flex items-center justify-center"
                      style={{
                        borderColor: plan.popular ? "rgba(0, 255, 102, 0.25)" : "var(--border-bright)",
                        background: plan.popular ? "rgba(0, 255, 102, 0.05)" : "rgba(255,255,255,0.02)",
                      }}
                    >
                      <Icon size={18} style={{ color: plan.popular ? "var(--accent)" : "var(--text-muted)" }} />
                    </div>
                  </div>

                  <p className="text-xs mb-6 min-h-[36px]" style={{ color: "var(--text-muted)", lineHeight: "1.4" }}>
                    {plan.description}
                  </p>

                  {/* Pricing Display */}
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-3xl md:text-5xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                      ${price}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      / month
                    </span>
                    {isYearly && price > 0 && (
                      <span className="text-[10px] ml-1.5" style={{ color: "var(--accent)" }}>
                        Billed annually
                      </span>
                    )}
                  </div>

                  {/* Feature Lists */}
                  <div className="space-y-4 mb-8">
                    <p className="text-[10px] font-bold tracking-wider" style={{ color: "var(--text-primary)" }}>
                      WHAT&apos;S INCLUDED:
                    </p>
                    <ul className="space-y-3 p-0 m-0">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          <Check size={13} style={{ color: plan.popular ? "var(--accent)" : "var(--accent-blue)", flexShrink: 0, marginTop: "2px" }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                      {plan.notIncluded.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs opacity-40" style={{ color: "var(--text-muted)" }}>
                          <X size={13} style={{ color: "var(--accent-red)", flexShrink: 0, marginTop: "2px" }} />
                          <span className="line-through">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Call To Action */}
                <button
                  onClick={() => router.push("/auth/register")}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border"
                  style={{
                    background: plan.popular ? "var(--accent)" : "transparent",
                    color: plan.popular ? "#000" : "var(--text-primary)",
                    borderColor: plan.popular ? "transparent" : "var(--border-bright)",
                  }}
                  onMouseEnter={(e) => {
                    if (plan.popular) {
                      e.currentTarget.style.filter = "brightness(1.1)";
                      e.currentTarget.style.boxShadow = "0 0 15px rgba(0, 255, 102, 0.35)";
                    } else {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.background = "rgba(0, 255, 102, 0.02)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (plan.popular) {
                      e.currentTarget.style.filter = "none";
                      e.currentTarget.style.boxShadow = "none";
                    } else {
                      e.currentTarget.style.borderColor = "var(--border-bright)";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {plan.actionText}
                  <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Accordion Section */}
        <div className="w-full max-w-3xl fade-up border-t pt-16" style={{ borderColor: "var(--border)" }}>
          <div className="text-center mb-10">
            <h2
              className="text-2xl font-bold mb-2 flex items-center justify-center gap-2"
              style={{ fontFamily: "Outfit, sans-serif", color: "var(--text-primary)" }}
            >
              <HelpCircle size={18} style={{ color: "var(--accent)" }} />
              Frequently Asked Questions
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Have questions regarding Embeddy plans? Find quick responses here.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border transition-all duration-200"
                  style={{
                    borderColor: isOpen ? "rgba(0, 255, 102, 0.2)" : "var(--border)",
                    background: isOpen ? "rgba(0, 255, 102, 0.015)" : "var(--surface)",
                  }}
                >
                  <button
                    onClick={() => setActiveFAQ(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left font-semibold text-xs sm:text-sm flex items-center justify-between gap-4 cursor-pointer bg-transparent border-none"
                    style={{ color: isOpen ? "var(--accent)" : "var(--text-primary)" }}
                  >
                    <span>{faq.question}</span>
                    <Plus
                      size={14}
                      className="transition-transform duration-300 flex-shrink-0"
                      style={{
                        transform: isOpen ? "rotate(45deg)" : "none",
                        color: isOpen ? "var(--accent)" : "var(--text-muted)",
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div
                      className="px-5 pb-4 text-xs leading-relaxed fade-up border-t pt-3"
                      style={{ color: "var(--text-muted)", borderColor: "rgba(255,255,255,0.03)" }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="w-full mt-auto py-6 border-t text-center text-[10px]"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)", background: "rgba(5, 5, 5, 0.4)" }}
      >
        <p>© 2026 Embeddy Inc. All rights reserved. Precision schematics, diagnostic checking, and dynamic firmwares.</p>
      </footer>
    </div>
  );
}
