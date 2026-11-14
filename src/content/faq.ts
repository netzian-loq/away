import { OVERTUNER } from "./overtuner";
import { UEFI_KOMPILE } from "./uefi-kompile";

export interface FaqEntry {
  question: string;
  answer: string;
}

const normal = UEFI_KOMPILE.plans.find((plan) => plan.id === "normal");
const pro = UEFI_KOMPILE.plans.find((plan) => plan.id === "pro");

/**
 * Questions answered on /services. Every answer restates something the site
 * already says elsewhere; the comment beside each entry names the file it
 * comes from, so a change there can be carried over here. Nothing in this
 * list is a new promise. Prices are read from the content, not retyped.
 */
export const FAQ: FaqEntry[] = [
  // services.ts: Windows Tuning ("no reinstall needed", "No reinstall: your
  // files stay put"); AwayOS + Windows Tuning ("A clean install of our own
  // custom gaming OS").
  {
    question: "Do I have to reinstall Windows?",
    answer:
      "No. Windows Tuning works on the Windows you already run, so your files stay put. Only the AwayOS services start from a clean install of our own custom gaming OS.",
  },
  // why.ts: "Reversible changes, full backups"; services.ts: "Safe rollback
  // profile saved"; about.ts Support step: "You keep a safe rollback profile".
  {
    question: "Is it reversible?",
    answer:
      "Yes. Changes are reversible and backed up, and you keep a safe rollback profile after the session.",
  },
  // about.ts Validate step: "stress-tested and benchmarked before and after,
  // often over hours ... under sustained load"; services.ts: "Stress +
  // real-game validation".
  {
    question: "How is stability checked?",
    answer:
      "Every change is stress-tested and benchmarked before and after, often over hours, and checked in real games, to confirm it holds under sustained load and not just on a clean boot.",
  },
  // jesterfv.ts / oneprodige.ts closeBody: "After you pay, a ticket on
  // Discord books your session"; site.ts discordSupportUrl: "Where buyers
  // open a ticket after paying".
  {
    question: "How do I book?",
    answer:
      "Pick a package or a single service and pay at checkout. After you pay, a ticket on our Discord books your session.",
  },
  // services.ts BIOS Full Tuning: "We tune your specific board (ASUS, MSI,
  // Gigabyte, ASRock)".
  {
    question: "Which motherboards do you tune?",
    answer:
      "We tune your specific board: ASUS, MSI, Gigabyte and ASRock, including the hidden BIOS menus your board never shows you.",
  },
  // about.ts Support step: "direct access to us on Discord for re-tuning
  // whenever your hardware, games, or drivers change"; why.ts: "re-tuning
  // whenever your hardware changes".
  {
    question: "What if my hardware changes later?",
    answer:
      "You keep direct access to us on Discord for re-tuning whenever your hardware, games or drivers change.",
  },
  // uefi-kompile.ts presetsBody: "Choose your platform (AM4, AM5, Intel or
  // X3D)"; Normal plan points: "Every preset: AM4, AM5, Intel and X3D".
  {
    question: "Which platforms does Uefi-Kompile support?",
    answer:
      "AM4, AM5, Intel and X3D. Choose your platform and every switch and tweak is set for you on screen; nothing is applied until you press Write.",
  },
  // uefi-kompile.ts plans: Normal 25 "For your own PC", "Tunes this PC's BIOS
  // only"; Pro 45 "Opens, tunes and saves NVRAM exported from any PC".
  {
    question: "Uefi-Kompile: Normal or Pro?",
    answer: `Normal (${normal?.price}€) tunes the BIOS of your own PC, the one you activate. Pro (${pro?.price}€) adds opening, tuning and saving BIOS exports from any PC, for tweakers. Both include ${UEFI_KOMPILE.freeCoins} coins.`,
  },
  // overtuner.ts: yearlyPrice 40; otherTerms "Monthly or lifetime? Ask in a
  // ticket".
  {
    question: "What does OverTuner cost?",
    answer: `${OVERTUNER.yearlyPrice}€ per year. For monthly or lifetime, ask in a ticket on Discord and we will sort it out there.`,
  },
];
