/**
 * legal.ts — Terms of Service, Privacy Policy, Anti-fraud Policy and
 * Commission Policy, in AR / FR / EN.
 */
import { Lang } from './data';
import { POLICY } from './policy';

export type LegalDocId = 'terms' | 'privacy' | 'fraud' | 'commissions';

export type LegalSection = { title: string; paragraphs: string[] };
export type LegalDoc = {
  id: LegalDocId;
  icon: string;
  version: string;
  updated: string;
  title: Record<Lang, string>;
  intro: Record<Lang, string>;
  sections: Record<Lang, LegalSection[]>;
};

export const LEGAL_VERSION = '1.2.0';

export const LEGAL_DOCS: LegalDoc[] = [
  {
    id: 'terms',
    icon: 'document-text',
    version: LEGAL_VERSION,
    updated: '2025-01-01',
    title: { ar: 'الشروط والأحكام', fr: "Conditions d'utilisation", en: 'Terms of Service' },
    intro: {
      ar: 'باستخدامك لتطبيق Zed Earn فإنك توافق على الشروط التالية التي تنظم العلاقة بينك وبين المنصة.',
      fr: "En utilisant Zed Earn, vous acceptez les conditions suivantes qui régissent votre relation avec la plateforme.",
      en: 'By using Zed Earn you agree to the following terms governing your relationship with the platform.',
    },
    sections: {
      ar: [
        {
          title: '1. الأهلية والحساب',
          paragraphs: [
            `يجب أن يكون عمرك ${POLICY.minAge} سنة على الأقل وأن تقيم في الجزائر وتملك رقم هاتف جزائري صالح (05/06/07).`,
            'يُسمح بحساب واحد فقط لكل شخص. أنت مسؤول عن سرية رمز التحقق (OTP) وعن كل نشاط يتم عبر حسابك.',
            'يحق للمنصة تعليق أو إغلاق أي حساب يخالف هذه الشروط مع الاحتفاظ بحق حجب الأرصدة الناتجة عن مخالفة.',
          ],
        },
        {
          title: '2. طبيعة الخدمة',
          paragraphs: [
            'Zed Earn وسيط تقني يربط بين التجار (المعلنين) والمسوّقين بالعمولة. المنصة ليست جهة توظيف ولا تضمن دخلاً ثابتاً.',
            'المهام المعروضة قد تتغير أو تُسحب في أي وقت حسب ميزانية المعلن. لا يُنشأ أي التزام قبل قبولك للمهمة.',
          ],
        },
        {
          title: '3. تنفيذ المهام والمراجعة',
          paragraphs: [
            `بعد قبول المهمة يجب إرسال إثبات صحيح خلال ${POLICY.proofReviewHours} ساعة. تُراجع الإثباتات آلياً ويدوياً.`,
            `عند رفض الإثبات تتلقى سبب الرفض ويمكنك إعادة الإرسال بحد أقصى ${POLICY.proofMaxResubmits} محاولات لكل مهمة.`,
            'المنصة هي المرجع النهائي في تقييم صحة الإثبات، مع حقك في الاعتراض عبر الدعم الفني خلال 7 أيام.',
          ],
        },
        {
          title: '4. الرصيد والسحب',
          paragraphs: [
            `تُقيَّد العمولات بالدينار الجزائري. الحد الأدنى للسحب ${POLICY.minWithdraw.toLocaleString()} دج والحد الأقصى ${POLICY.maxWithdrawPerDay.toLocaleString()} دج يومياً.`,
            'التحقق من الهوية (KYC) إلزامي قبل أول سحب. تُخصم رسوم المعالجة حسب طريقة السحب المبينة في سياسة العمولات.',
            'تُجمَّد المبالغ المطلوبة للسحب حتى اعتماد الطلب أو رفضه، وتُعاد للرصيد تلقائياً عند الرفض.',
          ],
        },
        {
          title: '5. إنهاء الخدمة والمسؤولية',
          paragraphs: [
            'يمكنك حذف حسابك في أي وقت من الإعدادات؛ تبقى سجلات المعاملات محفوظة لأغراض المحاسبة والامتثال.',
            'لا تتحمل المنصة مسؤولية أي خسارة غير مباشرة ناتجة عن انقطاع الخدمة أو خطأ في بيانات أدخلها المستخدم (مثل رقم CCP خاطئ).',
            'تخضع هذه الشروط للقانون الجزائري، وأي نزاع يُحل ودياً أولاً ثم أمام محاكم الجزائر العاصمة.',
          ],
        },
      ],
      fr: [
        {
          title: '1. Éligibilité et compte',
          paragraphs: [
            `Vous devez avoir au moins ${POLICY.minAge} ans, résider en Algérie et disposer d'un numéro algérien valide (05/06/07).`,
            "Un seul compte par personne. Vous êtes responsable de la confidentialité de votre code OTP et de toute activité sur votre compte.",
            'La plateforme peut suspendre ou fermer tout compte non conforme et retenir les soldes issus d’une infraction.',
          ],
        },
        {
          title: '2. Nature du service',
          paragraphs: [
            "Zed Earn est un intermédiaire technique entre annonceurs et affiliés. Ce n'est pas un employeur et aucun revenu fixe n'est garanti.",
            "Les tâches peuvent être modifiées ou retirées selon le budget de l'annonceur. Aucun engagement n'existe avant l'acceptation d'une tâche.",
          ],
        },
        {
          title: '3. Exécution et vérification',
          paragraphs: [
            `Après acceptation, la preuve doit être envoyée sous ${POLICY.proofReviewHours} heures. Les preuves sont vérifiées automatiquement et manuellement.`,
            `En cas de refus, le motif vous est communiqué et vous pouvez renvoyer une preuve (${POLICY.proofMaxResubmits} tentatives maximum).`,
            "La plateforme décide en dernier ressort, avec droit de recours via le support sous 7 jours.",
          ],
        },
        {
          title: '4. Solde et retraits',
          paragraphs: [
            `Les commissions sont créditées en DZD. Retrait minimum ${POLICY.minWithdraw.toLocaleString()} DZD, maximum ${POLICY.maxWithdrawPerDay.toLocaleString()} DZD par jour.`,
            "La vérification d'identité (KYC) est obligatoire avant le premier retrait. Des frais s'appliquent selon la méthode choisie.",
            'Les montants demandés sont gelés jusqu’à la décision, et automatiquement restitués en cas de refus.',
          ],
        },
        {
          title: '5. Résiliation et responsabilité',
          paragraphs: [
            "Vous pouvez supprimer votre compte à tout moment ; les écritures comptables sont conservées pour conformité.",
            "La plateforme n'est pas responsable des pertes indirectes liées à une interruption de service ou à des données erronées saisies par l'utilisateur (ex. CCP incorrect).",
            'Ces conditions sont régies par le droit algérien ; tout litige est réglé à l’amiable puis devant les tribunaux d’Alger.',
          ],
        },
      ],
      en: [
        {
          title: '1. Eligibility and account',
          paragraphs: [
            `You must be at least ${POLICY.minAge}, reside in Algeria and hold a valid Algerian number (05/06/07).`,
            'One account per person. You are responsible for keeping your OTP confidential and for all activity on your account.',
            'The platform may suspend or close any non-compliant account and withhold balances resulting from a violation.',
          ],
        },
        {
          title: '2. Nature of the service',
          paragraphs: [
            'Zed Earn is a technical intermediary between advertisers and affiliates. It is not an employer and guarantees no fixed income.',
            'Tasks may change or be withdrawn depending on advertiser budget. No obligation exists before you accept a task.',
          ],
        },
        {
          title: '3. Execution and review',
          paragraphs: [
            `After acceptance, proof must be submitted within ${POLICY.proofReviewHours} hours. Proofs are reviewed automatically and manually.`,
            `If rejected you receive the reason and may resubmit (max ${POLICY.proofMaxResubmits} attempts per task).`,
            'The platform is the final arbiter of proof validity; you may appeal through support within 7 days.',
          ],
        },
        {
          title: '4. Balance and withdrawals',
          paragraphs: [
            `Commissions are credited in DZD. Minimum withdrawal ${POLICY.minWithdraw.toLocaleString()} DZD, maximum ${POLICY.maxWithdrawPerDay.toLocaleString()} DZD per day.`,
            'KYC verification is mandatory before the first withdrawal. Processing fees apply per method as listed in the commission policy.',
            'Requested amounts are locked until the request is approved or rejected, and refunded automatically on rejection.',
          ],
        },
        {
          title: '5. Termination and liability',
          paragraphs: [
            'You may delete your account at any time; ledger records are retained for accounting and compliance purposes.',
            'The platform is not liable for indirect losses caused by service interruption or user-entered data errors (e.g. a wrong CCP number).',
            'These terms are governed by Algerian law; disputes are settled amicably first, then before the courts of Algiers.',
          ],
        },
      ],
    },
  },
  {
    id: 'privacy',
    icon: 'lock-closed',
    version: LEGAL_VERSION,
    updated: '2025-01-01',
    title: { ar: 'سياسة الخصوصية', fr: 'Politique de confidentialité', en: 'Privacy Policy' },
    intro: {
      ar: 'نوضح هنا البيانات التي نجمعها، سبب جمعها، وكيف تتحكم أنت فيها.',
      fr: 'Nous expliquons les données collectées, pourquoi, et comment vous les contrôlez.',
      en: 'This explains what data we collect, why, and how you stay in control of it.',
    },
    sections: {
      ar: [
        {
          title: '1. البيانات المجمّعة',
          paragraphs: [
            'بيانات الحساب: رقم الهاتف، البريد الإلكتروني (اختياري)، الاسم، تاريخ الميلاد، الولاية، رقم CCP.',
            'بيانات التحقق: صور بطاقة التعريف والسيلفي، وتُستعمل حصراً لإثبات الهوية.',
            'بيانات الاستخدام: المهام المقبولة، الإثباتات المرسلة، المعاملات المالية وسجل العمليات.',
          ],
        },
        {
          title: '2. مكان التخزين',
          paragraphs: [
            'في هذه النسخة التجريبية تُخزَّن كل بياناتك محلياً على جهازك (LocalStorage/AsyncStorage) ولا تُرسل إلى أي خادم.',
            'صور KYC والإثباتات تبقى على الجهاز ويمكن حذفها فوراً بتسجيل الخروج أو حذف بيانات المتصفح.',
          ],
        },
        {
          title: '3. الأساس القانوني والمشاركة',
          paragraphs: [
            'نعالج بياناتك لتنفيذ العقد (دفع العمولات) وللامتثال للالتزامات القانونية (مكافحة الاحتيال وغسل الأموال).',
            'لا نبيع بياناتك. في النسخة الإنتاجية قد تُشارك بيانات الدفع مع مزودي الخدمة المالية فقط بالقدر اللازم لإتمام التحويل.',
          ],
        },
        {
          title: '4. حقوقك',
          paragraphs: [
            'لك حق الاطلاع، التصحيح، الحذف، والاعتراض على المعالجة، وتصدير بياناتك.',
            'يمكنك حذف كل بياناتك من الإعدادات ← تسجيل الخروج (يمسح بيانات الجلسة) أو بمسح بيانات التطبيق/المتصفح.',
            'للاستفسارات المتعلقة بالخصوصية تواصل معنا عبر الدعم الفني داخل التطبيق.',
          ],
        },
      ],
      fr: [
        {
          title: '1. Données collectées',
          paragraphs: [
            'Compte : numéro de téléphone, e-mail (optionnel), nom, date de naissance, wilaya, numéro CCP.',
            "Vérification : photos de la carte d'identité et selfie, utilisées uniquement pour prouver votre identité.",
            'Usage : tâches acceptées, preuves envoyées, transactions et journal des opérations.',
          ],
        },
        {
          title: '2. Lieu de stockage',
          paragraphs: [
            'Dans cette version démo, toutes vos données restent localement sur votre appareil (LocalStorage/AsyncStorage) — aucun serveur.',
            'Les images KYC et les preuves restent sur l’appareil et peuvent être supprimées via la déconnexion ou l’effacement des données du navigateur.',
          ],
        },
        {
          title: '3. Base légale et partage',
          paragraphs: [
            "Traitement nécessaire à l'exécution du contrat (paiement des commissions) et au respect des obligations légales (anti-fraude, LAB).",
            'Nous ne vendons pas vos données. En production, seules les informations strictement nécessaires seraient transmises aux prestataires de paiement.',
          ],
        },
        {
          title: '4. Vos droits',
          paragraphs: [
            "Droit d'accès, de rectification, d'effacement, d'opposition et de portabilité.",
            'Vous pouvez supprimer vos données via Paramètres → Déconnexion, ou en effaçant les données de l’application/navigateur.',
            'Pour toute question relative à la vie privée, contactez le support intégré.',
          ],
        },
      ],
      en: [
        {
          title: '1. Data we collect',
          paragraphs: [
            'Account data: phone number, email (optional), name, date of birth, wilaya, CCP number.',
            'Verification data: ID card photos and selfie, used exclusively to prove your identity.',
            'Usage data: accepted tasks, submitted proofs, financial transactions and the operations log.',
          ],
        },
        {
          title: '2. Where data lives',
          paragraphs: [
            'In this demo build all data stays locally on your device (LocalStorage/AsyncStorage) — nothing is sent to a server.',
            'KYC images and proofs remain on-device and can be removed by logging out or clearing app/browser data.',
          ],
        },
        {
          title: '3. Legal basis and sharing',
          paragraphs: [
            'We process data to perform the contract (paying commissions) and to comply with legal duties (anti-fraud, AML).',
            'We never sell your data. In production, only strictly necessary payment details would be shared with financial providers.',
          ],
        },
        {
          title: '4. Your rights',
          paragraphs: [
            'You have the right to access, rectify, erase, object to processing, and export your data.',
            'You can delete everything from Settings → Log out, or by clearing app/browser storage.',
            'For privacy questions, contact us through the in-app support chat.',
          ],
        },
      ],
    },
  },
  {
    id: 'fraud',
    icon: 'shield-checkmark',
    version: LEGAL_VERSION,
    updated: '2025-01-01',
    title: { ar: 'سياسة مكافحة الاحتيال', fr: 'Politique anti-fraude', en: 'Anti-Fraud Policy' },
    intro: {
      ar: 'نطبّق سياسة صارمة لحماية المعلنين والمسوّقين النزيهين. أي محاولة تلاعب تُرصد وتُعاقب.',
      fr: 'Nous appliquons une politique stricte pour protéger annonceurs et affiliés honnêtes. Toute manipulation est détectée et sanctionnée.',
      en: 'We enforce a strict policy to protect advertisers and honest affiliates. Any manipulation is detected and sanctioned.',
    },
    sections: {
      ar: [
        {
          title: '1. الممارسات الممنوعة',
          paragraphs: [
            'الحسابات المتعددة أو المزيفة، وانتحال هوية شخص آخر أو استعمال وثائق ليست لك.',
            'الإثباتات المعدّلة أو المقتبسة من مستخدم آخر، ولقطات الشاشة المفبركة.',
            'البوتات، المزارع (click farms)، التطبيقات الآلية، والـ VPN لإخفاء الموقع الجغرافي.',
            'الطلبات الوهمية أو الملغاة عمداً في مهام البيع، وشراء متابعين مزيفين.',
          ],
        },
        {
          title: '2. آليات الكشف',
          paragraphs: [
            'مطابقة بصمة الجهاز، تحليل توقيت الإرسال، كشف الصور المكررة، ومراجعة بشرية للعينات.',
            'حدود معدل (Rate limiting) على إرسال الرموز، طلبات السحب، وإرسال الإثباتات لمنع الإساءة الآلية.',
            'سجل معاملات مترابط بتجزئة SHA-256؛ أي تعديل لاحق على قيد قديم يكسر السلسلة ويُكتشف فوراً.',
          ],
        },
        {
          title: '3. العقوبات المتدرجة',
          paragraphs: [
            'إنذار أول ورفض الإثبات مع إمكانية التصحيح.',
            'تجميد مؤقت للسحب (7 أيام) عند تكرار المخالفة، مع مراجعة يدوية للحساب.',
            'حظر نهائي وإلغاء العمولات غير المستحقة في حالات الاحتيال المتعمد أو انتحال الهوية.',
          ],
        },
        {
          title: '4. الإبلاغ والاعتراض',
          paragraphs: [
            'يمكنك الإبلاغ عن مهمة أو مستخدم مشبوه عبر الدعم الفني، ويُعالَج البلاغ خلال 48 ساعة.',
            'إن اعتبرت أن قراراً كان خاطئاً، قدّم اعتراضاً خلال 7 أيام مع أدلة إضافية وسيُعاد فحص الملف.',
          ],
        },
      ],
      fr: [
        {
          title: '1. Pratiques interdites',
          paragraphs: [
            "Comptes multiples ou faux, usurpation d'identité, utilisation de documents d'autrui.",
            "Preuves modifiées ou reprises d'un autre utilisateur, captures d'écran falsifiées.",
            'Bots, click farms, applications automatisées et VPN masquant la localisation.',
            'Commandes fictives ou annulées volontairement, achat de faux abonnés.',
          ],
        },
        {
          title: '2. Mécanismes de détection',
          paragraphs: [
            "Empreinte d'appareil, analyse des délais d'envoi, détection d'images dupliquées, revue humaine par échantillonnage.",
            'Limitation de débit sur l’envoi des codes, les demandes de retrait et les preuves.',
            'Journal chaîné par hachage SHA-256 : toute modification d’une écriture passée rompt la chaîne et est détectée.',
          ],
        },
        {
          title: '3. Sanctions graduées',
          paragraphs: [
            'Premier avertissement et refus de la preuve avec possibilité de correction.',
            'Gel temporaire des retraits (7 jours) en cas de récidive, avec revue manuelle du compte.',
            "Bannissement définitif et annulation des commissions indues en cas de fraude délibérée.",
          ],
        },
        {
          title: '4. Signalement et recours',
          paragraphs: [
            'Signalez toute tâche ou utilisateur suspect via le support ; traitement sous 48 heures.',
            'Vous pouvez contester une décision sous 7 jours avec des preuves complémentaires.',
          ],
        },
      ],
      en: [
        {
          title: '1. Prohibited practices',
          paragraphs: [
            'Multiple or fake accounts, impersonation, or using documents that are not yours.',
            'Edited proofs, proofs copied from other users, and fabricated screenshots.',
            'Bots, click farms, automation apps, and VPNs used to hide your location.',
            'Fake or deliberately cancelled orders in sales tasks, and purchased fake followers.',
          ],
        },
        {
          title: '2. Detection mechanisms',
          paragraphs: [
            'Device fingerprinting, submission-timing analysis, duplicate-image detection and human sample review.',
            'Rate limiting on OTP sending, withdrawal requests and proof submissions to block automated abuse.',
            'SHA-256 hash-chained ledger: any later edit of a past entry breaks the chain and is detected immediately.',
          ],
        },
        {
          title: '3. Graduated sanctions',
          paragraphs: [
            'First warning and proof rejection with a chance to correct.',
            'Temporary withdrawal freeze (7 days) on repeat offences, plus manual account review.',
            'Permanent ban and reversal of undue commissions for deliberate fraud or identity theft.',
          ],
        },
        {
          title: '4. Reporting and appeals',
          paragraphs: [
            'Report any suspicious task or user through support; reports are handled within 48 hours.',
            'If you believe a decision was wrong, appeal within 7 days with additional evidence.',
          ],
        },
      ],
    },
  },
  {
    id: 'commissions',
    icon: 'calculator',
    version: LEGAL_VERSION,
    updated: '2025-01-01',
    title: { ar: 'سياسة العمولات والرسوم', fr: 'Politique de commissions', en: 'Commission & Fee Policy' },
    intro: {
      ar: 'كل مبلغ في التطبيق يُحسب بهذه القواعد الشفافة، بدون رسوم خفية.',
      fr: 'Chaque montant est calculé selon ces règles transparentes, sans frais cachés.',
      en: 'Every amount in the app is computed with these transparent rules — no hidden fees.',
    },
    sections: {
      ar: [
        {
          title: '1. عمولة المهمة',
          paragraphs: [
            'تُقيَّد العمولة المعلنة كاملة بدون خصم من المسوّق؛ المنصة تتقاضى رسومها من المعلن.',
            `مكافأة المستوى تُضاف فوق العمولة: مبتدئ 0% · نشط +${POLICY.levelBonus.lvlActive * 100}% · محترف +${POLICY.levelBonus.lvlPro * 100}% · VIP +${POLICY.levelBonus.lvlVip * 100}%.`,
            `تُفتح مهام VIP بعد إكمال ${POLICY.vipUnlockTasks} مهام بنجاح.`,
          ],
        },
        {
          title: '2. عمولة الإحالة',
          paragraphs: [
            `${POLICY.referralBonus} دج عند إكمال صديقك المدعو لأول مهمة عبر كودك.`,
            `${POLICY.referralShare * 100}% من عمولات إحالاتك مدى الحياة، تُدفع من حصة المنصة ولا تُخصم من صديقك.`,
          ],
        },
        {
          title: '3. رسوم السحب',
          paragraphs: [
            `CCP بريد الجزائر: ${POLICY.fees.mCcp.pct * 100}% (بحد أدنى ${POLICY.fees.mCcp.min} دج وأقصى ${POLICY.fees.mCcp.max} دج).`,
            `المحافظ الإلكترونية: ${POLICY.fees.mWallet.pct * 100}% (${POLICY.fees.mWallet.min}–${POLICY.fees.mWallet.max} دج).`,
            `البطاقة البنكية: ${POLICY.fees.mCard.pct * 100}% (${POLICY.fees.mCard.min}–${POLICY.fees.mCard.max} دج).`,
            `الحد الأدنى للسحب ${POLICY.minWithdraw.toLocaleString()} دج والحد اليومي ${POLICY.maxWithdrawPerDay.toLocaleString()} دج.`,
          ],
        },
        {
          title: '4. رسوم التاجر',
          paragraphs: [
            `عند نشر حملة، يدفع التاجر قيمة العمولة + ${POLICY.merchantFeePct * 100}% رسوم منصة.`,
            `قيمة العمولة المسموح بها للحملة بين ${POLICY.merchantMinReward} دج و ${POLICY.merchantMaxReward.toLocaleString()} دج.`,
          ],
        },
        {
          title: '5. شفافية السجل',
          paragraphs: [
            'كل قيد مالي يحمل رقماً تسلسلياً وبصمة SHA-256 مرتبطة بالقيد السابق (سلسلة غير قابلة للتلاعب).',
            'يمكنك التحقق من سلامة السجل في أي وقت من شاشة المحفظة ← «تحقق من السجل».',
          ],
        },
      ],
      fr: [
        {
          title: '1. Commission de tâche',
          paragraphs: [
            "La commission affichée est créditée intégralement ; la plateforme se rémunère auprès de l'annonceur.",
            `Bonus de niveau ajouté : Débutant 0% · Actif +${POLICY.levelBonus.lvlActive * 100}% · Pro +${POLICY.levelBonus.lvlPro * 100}% · VIP +${POLICY.levelBonus.lvlVip * 100}%.`,
            `Les tâches VIP se débloquent après ${POLICY.vipUnlockTasks} tâches réussies.`,
          ],
        },
        {
          title: '2. Commission de parrainage',
          paragraphs: [
            `${POLICY.referralBonus} DZD lorsque votre filleul termine sa première tâche.`,
            `${POLICY.referralShare * 100}% de ses commissions à vie, payés par la plateforme sans rien retirer à votre filleul.`,
          ],
        },
        {
          title: '3. Frais de retrait',
          paragraphs: [
            `CCP Algérie Poste : ${POLICY.fees.mCcp.pct * 100}% (min ${POLICY.fees.mCcp.min} — max ${POLICY.fees.mCcp.max} DZD).`,
            `Portefeuilles électroniques : ${POLICY.fees.mWallet.pct * 100}% (${POLICY.fees.mWallet.min}–${POLICY.fees.mWallet.max} DZD).`,
            `Carte bancaire : ${POLICY.fees.mCard.pct * 100}% (${POLICY.fees.mCard.min}–${POLICY.fees.mCard.max} DZD).`,
            `Minimum ${POLICY.minWithdraw.toLocaleString()} DZD, plafond journalier ${POLICY.maxWithdrawPerDay.toLocaleString()} DZD.`,
          ],
        },
        {
          title: '4. Frais marchand',
          paragraphs: [
            `Publier une campagne coûte la commission + ${POLICY.merchantFeePct * 100}% de frais de plateforme.`,
            `Commission autorisée entre ${POLICY.merchantMinReward} et ${POLICY.merchantMaxReward.toLocaleString()} DZD.`,
          ],
        },
        {
          title: '5. Transparence du journal',
          paragraphs: [
            'Chaque écriture porte un numéro de séquence et une empreinte SHA-256 liée à la précédente.',
            'Vérifiez l’intégrité à tout moment depuis Portefeuille → « Vérifier le journal ».',
          ],
        },
      ],
      en: [
        {
          title: '1. Task commission',
          paragraphs: [
            'The advertised commission is credited in full; the platform charges its fee to the advertiser.',
            `Level bonus on top: Beginner 0% · Active +${POLICY.levelBonus.lvlActive * 100}% · Pro +${POLICY.levelBonus.lvlPro * 100}% · VIP +${POLICY.levelBonus.lvlVip * 100}%.`,
            `VIP tasks unlock after ${POLICY.vipUnlockTasks} successfully completed tasks.`,
          ],
        },
        {
          title: '2. Referral commission',
          paragraphs: [
            `${POLICY.referralBonus} DZD when your invited friend completes their first task with your code.`,
            `${POLICY.referralShare * 100}% of their commissions for life, paid by the platform — never deducted from your friend.`,
          ],
        },
        {
          title: '3. Withdrawal fees',
          paragraphs: [
            `CCP Algérie Poste: ${POLICY.fees.mCcp.pct * 100}% (min ${POLICY.fees.mCcp.min} — max ${POLICY.fees.mCcp.max} DZD).`,
            `E-wallets: ${POLICY.fees.mWallet.pct * 100}% (${POLICY.fees.mWallet.min}–${POLICY.fees.mWallet.max} DZD).`,
            `Bank card: ${POLICY.fees.mCard.pct * 100}% (${POLICY.fees.mCard.min}–${POLICY.fees.mCard.max} DZD).`,
            `Minimum ${POLICY.minWithdraw.toLocaleString()} DZD, daily cap ${POLICY.maxWithdrawPerDay.toLocaleString()} DZD.`,
          ],
        },
        {
          title: '4. Merchant fees',
          paragraphs: [
            `Publishing a campaign costs the reward + ${POLICY.merchantFeePct * 100}% platform fee.`,
            `Allowed campaign reward: ${POLICY.merchantMinReward} to ${POLICY.merchantMaxReward.toLocaleString()} DZD.`,
          ],
        },
        {
          title: '5. Ledger transparency',
          paragraphs: [
            'Every entry carries a sequence number and a SHA-256 fingerprint chained to the previous entry.',
            'You can verify integrity any time from Wallet → “Verify ledger”.',
          ],
        },
      ],
    },
  },
];

export const getLegalDoc = (id: LegalDocId) => LEGAL_DOCS.find((d) => d.id === id)!;
