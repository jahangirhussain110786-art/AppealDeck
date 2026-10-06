import { describe, expect, it } from "vitest";
import { detectLanguage } from "@/lib/language";
import { FIXTURES } from "@/core/fixtures";

describe("detectLanguage", () => {
  it.each([
    [
      "de",
      "Ihr Amazon-Verkäuferkonto wurde gesperrt, weil wir Verstöße gegen unsere Richtlinien festgestellt haben. Bitte senden Sie uns einen Aktionsplan, der die Ursache beschreibt.",
    ],
    [
      "fr",
      "Votre compte vendeur Amazon a été suspendu parce que nous avons constaté des violations de nos règles. Veuillez nous envoyer un plan d'action qui décrit la cause et les mesures que vous avez prises.",
    ],
    [
      "es",
      "Su cuenta de vendedor de Amazon ha sido suspendida porque hemos detectado infracciones de nuestras políticas. Por favor envíe un plan de acción que describa la causa y las medidas que ha tomado.",
    ],
    [
      "it",
      "Il tuo account venditore Amazon è stato sospeso perché abbiamo rilevato violazioni delle nostre politiche. Invia un piano d'azione che descriva la causa e le misure che hai adottato per risolvere il problema.",
    ],
    [
      "pt",
      "A sua conta de vendedor da Amazon foi suspensa porque detectámos violações das nossas políticas. Envie um plano de ação que descreva a causa e as medidas que você tomou para resolver o problema.",
    ],
    [
      "nl",
      "Uw Amazon verkopersaccount is opgeschort omdat wij overtredingen van ons beleid hebben vastgesteld. Stuur ons een actieplan dat de oorzaak en de maatregelen beschrijft die u heeft genomen.",
    ],
    [
      "tr",
      "Amazon satıcı hesabınız politikalarımızı ihlal ettiği için askıya alınmıştır. Lütfen nedeni ve sorunu çözmek için aldığınız önlemleri açıklayan bir eylem planı gönderin ve hesabınız için ek belge sağlayın.",
    ],
  ])("recognises %s and refuses it as unsupported", (code, text) => {
    const guess = detectLanguage(text);
    expect(guess.code).toBe(code);
    expect(guess.supported).toBe(false);
  });

  it("recognises scripts, including Japanese written with Han characters and kana", () => {
    expect(
      detectLanguage(
        "お客様のAmazonセラーアカウントは、ポリシー違反のため停止されました。アカウントを再開するには、改善計画書を提出してください。",
      ).code,
    ).toBe("ja");
    expect(
      detectLanguage(
        "تم تعليق حساب البائع الخاص بك على أمازون بسبب انتهاك سياساتنا. يرجى تقديم خطة عمل توضح السبب.",
      ).code,
    ).toBe("ar");
    expect(
      detectLanguage(
        "您的亚马逊卖家账户因违反我们的政策已被暂停。请提交行动计划，说明原因和您已采取的措施。",
      ).code,
    ).toBe("zh");
  });

  it("calls English English, including every corpus notice and a notice quoting foreign words", () => {
    expect(FIXTURES.filter((f) => !detectLanguage(f.raw).supported).map((f) => f.id)).toEqual([]);
    expect(
      detectLanguage(
        "Your Amazon selling account was suspended. The invoice from Müller GmbH (Rechnung Nr. 1234, Verkäufer: Hans Müller) does not show the buyer's address. Please provide an invoice that does.",
      ).supported,
    ).toBe(true);
  });

  it("judges nothing from a few words", () => {
    expect(detectLanguage("Konto gesperrt").supported).toBe(true);
    expect(detectLanguage("").supported).toBe(true);
  });
});
