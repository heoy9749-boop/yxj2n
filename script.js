/**
 * 스킨핏 (SkinFit) - 피부타입 진단기 스크립트
 * - 8개 정밀 문항 (각 5~6개 다채로운 선지로 세분화하여 모든 피부 상태 포괄)
 * - 3차원 축(유분도, 속당김/수분부족, 민감도) 정규화 채점 알고리즘
 * - 6개 세부 피부타입 도출 & 찰떡 맞춤 성분 매칭
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. 8가지 정밀 진단 질문 데이터 (선지 5~6개로 세분화)
  // ==========================================
  const questions = [
    {
      category: "세안 직후 반응",
      question: "1. 세안 직후 아무것도 바르지 않고 10분이 지났을 때 피부 느낌은?",
      hint: "스킨케어 전 피부 본연의 유수분 방어 상태를 선택해 주세요.",
      options: [
        { text: "얼굴 전체가 찢어질 듯 극심하게 당기고 피부가 땅땅하게 굳는 느낌이다", oil: 0, moist: 10, sens: 3 },
        { text: "T존(이마/코)은 괜찮으나 볼, 입가, 눈가 주변이 뚜렷하게 당긴다", oil: 4, moist: 7, sens: 1 },
        { text: "당김은 심하지 않으나, 피부 표면이 푸석하고 속이 뻣뻣한 느낌이 든다", oil: 4, moist: 5, sens: 2 },
        { text: "당김이 전혀 없고 적당히 촉촉하고 편안하다", oil: 5, moist: 1, sens: 0 },
        { text: "당김은 전혀 없고 얼마 지나지 않아 코와 이마에 번들거리는 유분이 맺힌다", oil: 9, moist: 0, sens: 1 },
        { text: "당김과 동시에 얼굴이 붉게 달아오르거나 미세하게 가렵고 따갑다", oil: 2, moist: 8, sens: 9 }
      ]
    },
    {
      category: "오후 피지 분비",
      question: "2. 스킨케어 후 4~5시간이 지난 오후 3~4시경 거울 속 피부는?",
      hint: "시간이 지남에 따라 분비되는 유분량과 메이크업/피부 상태를 확인합니다.",
      options: [
        { text: "기름기는 전혀 없고, 피부가 가뭄 든 듯 메마르거나 하얗게 들뜬다", oil: 0, moist: 9, sens: 2 },
        { text: "이마와 콧등(T존)만 번들거리고 볼 부위는 보송하거나 건조하다", oil: 6, moist: 5, sens: 1 },
        { text: "겉은 번들거리는 기름이 도는데 속은 여전히 팽팽하게 메마르고 당긴다", oil: 8, moist: 9, sens: 3 },
        { text: "번들거림 없이 은은하고 건강한 윤기만 유지된다", oil: 4, moist: 2, sens: 0 },
        { text: "얼굴 전체에 기름종이가 흠뻑 젖을 정도로 피지가 솟아나 번들거린다", oil: 10, moist: 1, sens: 2 },
        { text: "유분이 올라오면서 얼굴에 열감이 차오르거나 붉은 기가 번진다", oil: 7, moist: 5, sens: 8 }
      ]
    },
    {
      category: "부위별 유수분 불균형",
      question: "3. 이마/코(T존)와 볼/턱(U존)의 피부 상태 차이는 어떤가요?",
      hint: "부위별 피지선 분포 및 유수분 불균형 정도를 진단합니다.",
      options: [
        { text: "T존과 U존 가릴 것 없이 얼굴 전체가 균일하게 건조하고 푸석하다", oil: 1, moist: 8, sens: 1 },
        { text: "T존은 유분으로 번들거리는데 볼(U존)은 확실하게 당기고 건조하다", oil: 6, moist: 6, sens: 1 },
        { text: "T존과 U존 모두 유분이 왕성하여 얼굴 전체가 번들거린다", oil: 9, moist: 2, sens: 1 },
        { text: "T존은 기름지고 U존은 건조한데 볼과 턱 주변에 좁쌀 트러블까지 난다", oil: 7, moist: 8, sens: 6 },
        { text: "부위별 편차 없이 유수분 밸런스가 균일하게 안정되어 있다", oil: 4, moist: 1, sens: 0 },
        { text: "T존은 보통인데 볼(U존) 부위만 극도로 붉어지거나 각질이 일어난다", oil: 3, moist: 7, sens: 8 }
      ]
    },
    {
      category: "민감도 & 자극 반응",
      question: "4. 새로운 화장품을 사용하거나 마스크 착용, 미세먼지 접촉 시 반응은?",
      hint: "외부 유해 환경과 자극에 대한 피부 장벽 방어력을 진단합니다.",
      options: [
        { text: "어떤 제품이나 환경 변화에도 끄떡없이 편안하게 적응한다", oil: 0, moist: 0, sens: 0 },
        { text: "컨디션이 안 좋거나 환절기 때만 가끔 가렵거나 뾰루지가 1~2개 올라온다", oil: 1, moist: 2, sens: 4 },
        { text: "성분이 조금만 안 맞거나 강하면 금세 붉어지고 화끈거린다", oil: 0, moist: 3, sens: 9 },
        { text: "마스크, 머리카락 등 물리적 접촉이나 마찰에 피부가 쉽게 가렵고 붉어진다", oil: 1, moist: 4, sens: 8 },
        { text: "알코올, 비타민C, 레티놀 등 특정 기능성 성분에만 유독 따갑고 뒤집힌다", oil: 2, moist: 3, sens: 7 },
        { text: "새 화장품을 쓰면 좁쌀 여드름이나 가려운 접촉성 트러블이 즉각 발생한다", oil: 3, moist: 4, sens: 10 }
      ]
    },
    {
      category: "트러블 발생 양상",
      question: "5. 여드름, 뾰루지, 좁쌀 등 트러블이 발생하는 빈도와 양상은?",
      hint: "피지 과다 분비 및 모공 속 염증 반응을 종합적으로 평가합니다.",
      options: [
        { text: "1년에 한두 번 날까 말까 할 정도로 트러블 고민이 거의 없다", oil: 1, moist: 1, sens: 0 },
        { text: "생리 주기, 수면 부족, 스트레스 시기에만 턱이나 이마에 가끔 난다", oil: 4, moist: 3, sens: 3 },
        { text: "화농성 여드름보다는 짜지지 않는 자잘한 좁쌀(화이트헤드)이 자주 낀다", oil: 6, moist: 7, sens: 5 },
        { text: "모공 주변으로 붉고 아픈 염증성 트러블이 주기적으로 번갈아가며 난다", oil: 8, moist: 3, sens: 8 },
        { text: "얼굴 전체에 크고 작은 뾰루지와 피지 분비가 멈추지 않고 상주한다", oil: 10, moist: 2, sens: 8 },
        { text: "오일이나 유분기 있는 화장품을 발랐을 때만 모공이 막혀 즉시 트러블이 난다", oil: 5, moist: 4, sens: 7 }
      ]
    },
    {
      category: "모공 & 블랙헤드",
      question: "6. 코와 나비존(코 주변 볼)의 모공 크기와 피지 상태는?",
      hint: "피지가 배출되는 통로인 모공의 확장 정도를 확인합니다.",
      options: [
        { text: "모공이 눈에 띄지 않을 정도로 매우 작고 피지나 블랙헤드가 없다", oil: 0, moist: 4, sens: 0 },
        { text: "코 주변에만 약간의 블랙헤드가 보이고 볼 부위 모공은 양호하다", oil: 5, moist: 2, sens: 1 },
        { text: "모공 크기는 보통이나 오후가 되면 하얀 피지가 모공 위로 차오른다", oil: 7, moist: 3, sens: 3 },
        { text: "코와 볼 전체 모공이 넓게 열려있고 까만 블랙헤드가 두드러진다", oil: 10, moist: 1, sens: 2 },
        { text: "모공도 넓은 편인데 각질이 겉을 덮어 피지가 갇혀 울퉁불퉁하다", oil: 8, moist: 8, sens: 5 },
        { text: "수분 부족과 탄력 저하로 모공이 세로로 길게 늘어져 보인다", oil: 3, moist: 8, sens: 3 }
      ]
    },
    {
      category: "각질 & 피부 결",
      question: "7. 환절기나 겨울철 하얗게 일어나는 각질과 피부 결 상태는?",
      hint: "피부 최외곽 각질층의 보습 장벽 유지력을 진단합니다.",
      options: [
        { text: "계절 상관없이 항상 결이 매끄럽고 각질이나 건조함이 거의 없다", oil: 4, moist: 1, sens: 0 },
        { text: "하얗게 각질이 들뜨고 입가나 볼이 메말라 화장이 뭉치고 뜬다", oil: 0, moist: 10, sens: 3 },
        { text: "코 옆이나 눈썹 사이 등 부분적으로만 미세하게 각질이 인다", oil: 4, moist: 5, sens: 2 },
        { text: "피부는 번들거리는데 화장만 하면 하얗게 각질이 들뜨고 밀린다", oil: 8, moist: 9, sens: 4 },
        { text: "각질제거제를 조금만 써도 피부가 붉어지고 따가워 각질 제거를 못 한다", oil: 1, moist: 7, sens: 9 },
        { text: "각질 고민은 전혀 없고 오직 유분과 번들거림만 고민이다", oil: 10, moist: 0, sens: 0 }
      ]
    },
    {
      category: "보습제 제형 선호도",
      question: "8. 평소 내 피부에 발랐을 때 가장 편안하고 만족스러운 제형은?",
      hint: "실제 피부가 가장 갈망하고 부작용 없이 받아들이는 텍스처를 파악합니다.",
      options: [
        { text: "영양감 가득한 무거운 고보습 오일, 밤, 리치한 시어버터 크림", oil: 0, moist: 10, sens: 1 },
        { text: "유수분이 균형 있게 섞인 일반적인 수분 로션이나 보습 에멀전", oil: 4, moist: 4, sens: 1 },
        { text: "오일감이 배제된 산뜻하고 끈적임 없는 워터/젤 타입 수분크림", oil: 9, moist: 2, sens: 1 },
        { text: "기름지지 않으면서 피부 속까지 빠르게 흡수되는 고수분 앰플/세럼", oil: 7, moist: 8, sens: 2 },
        { text: "피부 진정 성분(시카/판테놀)이 듬뿍 든 저자극 마일드 진정 크림", oil: 3, moist: 5, sens: 8 },
        { text: "크림을 바르면 답답하고 모공이 막혀 물 토너 여러 번 레이어링하는 걸 선호한다", oil: 8, moist: 4, sens: 6 }
      ]
    }
  ];

  // ==========================================
  // 2. 6가지 피부 타입 상세 데이터베이스
  // ==========================================
  const skinDatabase = {
    dehydrated_oily: {
      badge: "💧 속당김 탈출형",
      name: "수분부족형 지성 (수부지)",
      desc: "겉은 피지로 번들거리지만, 피부 속은 수분이 메말라 세안 직후나 오후에 심한 속당김을 겪는 한국인 대표 피부 상태입니다. 유수분 밸런스 붕괴로 인해 피부가 스스로를 보호하려 피지를 더 뿜어내는 상태입니다.",
      oilComment: "피지 분비가 왕성하여 겉이 쉽게 번들거려요.",
      moistComment: "속당김 지수가 높아 수분 보충이 시급해요.",
      sensComment: "유수분 불균형으로 컨디션에 따라 민감해질 수 있어요.",
      good: [
        { name: "히알루론산", desc: "분자 크기별로 피부 속까지 수분을 채워 속건조를 즉각 해소합니다." },
        { name: "판테놀 (비타민 B5)", desc: "무너진 유수분 균형을 잡고 피부 장벽을 탄탄하게 복구합니다." },
        { name: "나이아신아마이드", desc: "과도한 피지 분비를 억제하고 모공 탄력을 높여줍니다." }
      ],
      bad: [
        { name: "고함량 쉐어버터 / 미네랄오일", desc: "모공을 막아 좁쌀 여드름을 유발할 수 있습니다." },
        { name: "변성알코올(고함량)", desc: "일시적 청량감 뒤 수분을 빼앗아가 속당김을 심화시킵니다." }
      ],
      routine: "오일감이 배제된 수분 토너를 2~3회 레이어링하여 속수분을 꽉 채운 후, 끈적이지 않는 산뜻한 젤 크림으로 얇은 수분 보호막을 씌워주세요."
    },
    dry: {
      badge: "🌵 오아시스 갈망형",
      name: "극건성 / 건성 (Dry)",
      desc: "피지 분비와 수분 함유량 모두가 부족하여 세안 후 심한 당김을 느끼고, 사계절 내내 각질이 일어나기 쉬운 메마른 피부 상태입니다. 유분과 수분을 모두 충분히 채워주어야 합니다.",
      oilComment: "피지 분비가 극히 적어 자연 보습막이 부족해요.",
      moistComment: "수분 결핍이 심해 잔주름과 각질이 잘 생겨요.",
      sensComment: "건조함으로 인해 피부 방어벽이 약해져 있어요.",
      good: [
        { name: "세라마이드 NP", desc: "각질 세포 사이를 촘촘히 메워 수분 증발을 원천 차단합니다." },
        { name: "식물성 스쿠알란", desc: "부족한 피지를 대신해 가볍고 윤기 있는 보호막을 형성합니다." },
        { name: "글리세린 & 판테놀", desc: "공기 중 수분을 끌어당겨 오랜 시간 촉촉함을 유지합니다." }
      ],
      bad: [
        { name: "고농도 AHA/BHA (살리실산)", desc: "필요한 각질과 유분을 깎아내어 건조증을 악화시킵니다." },
        { name: "알코올 / 에탄올", desc: "피부 수분을 강하게 증발시켜 극심한 당김을 유발합니다." }
      ],
      routine: "약산성 밀크 클렌저로 순하게 세안한 뒤, 점도가 있는 콧물 토너와 세라마이드 고보습 크림을 듬뿍 발라 영양막을 만들어주세요."
    },
    oily: {
      badge: "✨ 산뜻 청정형",
      name: "지성 (Oily)",
      desc: "피지선이 매우 활성화되어 얼굴 전체에 유분이 많고, 모공이 발달하여 번들거림과 블랙헤드가 두드러지는 피부 상태입니다. 피지 조절과 모공 정화가 최우선입니다.",
      oilComment: "피지 분비가 매우 활발해 번들거림이 강해요.",
      moistComment: "자체 유분막 덕분에 속당김은 거의 없어요.",
      sensComment: "피부 장벽 자체는 튼튼하나 모공 트러블에 취약해요.",
      good: [
        { name: "살리실산 (BHA 0.5~2%)", desc: "지용성 성분으로 모공 깊숙이 침투해 묵은 피지와 각질을 녹입니다." },
        { name: "징크 PCA (아연)", desc: "과도한 피지 분비를 조절하고 번들거림을 잡아줍니다." },
        { name: "티트리잎 추출물", desc: "모공 정화 및 유분으로 인한 트러블 발생을 예방합니다." }
      ],
      bad: [
        { name: "코코넛오일 / 이소프로필미리스테이트", desc: "강력한 모공 막힘 유발 성분(Comedogenic)입니다." },
        { name: "스테아릭애씨드 (고함량)", desc: "유분을 과다하게 공급해 모공을 막고 뾰루지를 유발합니다." }
      ],
      routine: "풍성하고 쫀쫀한 거품의 젤 폼으로 모공 속 피지를 깨끗이 세정하고, 오일프리 수분 에센스 하나로 가볍게 마무리해 유분을 최소화하세요."
    },
    combination: {
      badge: "⚖️ 밸런스 조율형",
      name: "복합성 (Combination)",
      desc: "이마와 코 등 T존은 피지로 번들거려 모공이 고민이지만, 볼과 턱 등 U존은 건조하거나 편안한 부위별 복합 상태입니다. 부위별 맞춤 케어가 필요합니다.",
      oilComment: "T존 위주로 국소 유분이 집중되어 있어요.",
      moistComment: "볼 부위는 계절에 따라 당김이 있을 수 있어요.",
      sensComment: "대체로 안정적이나 유수분 차이에 적응이 필요해요.",
      good: [
        { name: "녹차 추출물", desc: "T존의 번들거리는 유분을 정돈하고 산뜻한 항산화 효과를 줍니다." },
        { name: "베타글루칸", desc: "끈적임 없이 피부 전체에 균형 잡힌 보습막을 제공합니다." },
        { name: "나이아신아마이드", desc: "부위별 톤 정리와 유수분 밸런스를 조화롭게 맞춥니다." }
      ],
      bad: [
        { name: "지나치게 리치한 크림", desc: "T존에 바를 경우 모공 막힘과 트러블을 유발합니다." },
        { name: "강한 오일 컨트롤 스킨", desc: "U존 볼 부위의 건조함을 악화시켜 하얗게 뜨게 만듭니다." }
      ],
      routine: "얼굴 전체에 가벼운 수분 로션을 흡수시킨 뒤, 건조한 볼 부위에만 보습 크림을 한 번 더 덧바르는 '존(Zone)별 분할 케어'를 추천합니다."
    },
    sensitive_dry: {
      badge: "🛡️ 퓨어 진정보호형",
      name: "민감성 건성 (Sensitive Dry)",
      desc: "피부가 건조함과 동시에 외부 자극에 매우 취약하여, 조금만 찬바람을 맞거나 화장품을 바꾸어도 쉽게 붉어지고 따가운 연약한 피부 상태입니다.",
      oilComment: "유분이 부족하여 외부 자극을 막는 방패가 약해요.",
      moistComment: "수분 손실이 빨라 쉽게 가렵고 건조해요.",
      sensComment: "민감도가 높아 화장품 성분 선택에 매우 주의해야 해요.",
      good: [
        { name: "마데카소사이드 / 병풀 추출물", desc: "붉게 달아오른 자극과 열감을 순하게 진정시킵니다." },
        { name: "알란토인", desc: "자극받은 피부 장벽을 편안하게 보호하고 재생을 돕습니다." },
        { name: "세라마이드 & 판테놀", desc: "손상된 지질 장벽을 재건하여 자극 유입을 차단합니다." }
      ],
      bad: [
        { name: "인공 향료 및 타르 색소", desc: "민감 피부에 알레르기 및 접촉성 피부염을 가장 흔히 일으킵니다." },
        { name: "에센셜 오일 (라벤더/시트러스류)", desc: "천연이라도 민감성 건성에게는 강한 알레르기 반응을 유발할 수 있습니다." }
      ],
      routine: "전성분 20개 이하의 무향·저자극 약산성 크림을 사용하고, 물리적 마찰(화장솜 문지르기, 강한 클렌징)을 최대한 피하세요."
    },
    sensitive_oily: {
      badge: "🌿 카밍 트러블케어형",
      name: "민감성 지성 / 트러블성 (Sensitive Oily)",
      desc: "과도하게 분비되는 피지와 함께 염증성 트러블, 붉은 기, 좁쌀 뾰루지가 지속적으로 동반되는 피부 상태입니다. 피지 조절과 항염 진정이 동시에 필요합니다.",
      oilComment: "피지 분비가 많아 모공 내 염증 환경이 조성돼요.",
      moistComment: "트러블 케어 제품 남용 시 일시적 속당김이 올 수 있어요.",
      sensComment: "염증 반응과 붉은 기가 잦아 매우 섬세한 관리가 필요해요.",
      good: [
        { name: "어성초 (약모밀) 추출물", desc: "트러블 부위의 열감을 내리고 뛰어난 항염·항균 케어를 선사합니다." },
        { name: "아줄렌 / 구아이아줄렌", desc: "붉은 기를 즉각 진정시키고 피부 스트레스를 완화합니다." },
        { name: "약산성 BHA (0.5%)", desc: "자극 없이 부드럽게 모공 통로를 열어 피지 배출을 돕습니다." }
      ],
      bad: [
        { name: "피이지(PEG) 계열 유화제", desc: "손상된 피부 장벽에 침투해 염증을 자극할 수 있습니다." },
        { name: "고농도 알코올 토너", desc: "소독하듯 바르면 장벽이 손상되어 염증이 더 붉어집니다." }
      ],
      routine: "점도가 없는 워터 타입 진정 패드로 열감을 식혀준 뒤, 논코메도제닉(모공 막힘 방지) 인증을 받은 가벼운 진정 수분 세럼으로 유분을 관리하세요."
    }
  };

  // ==========================================
  // 3. 상태 관리 변수
  // ==========================================
  let currentStep = 0;
  let userAnswers = [];

  // DOM 요소
  const introSection = document.getElementById('introSection');
  const quizSection = document.getElementById('quizSection');
  const loadingSection = document.getElementById('loadingSection');
  const resultSection = document.getElementById('resultSection');

  const startTestBtn = document.getElementById('startTestBtn');
  const navStartBtn = document.getElementById('navStartBtn');
  const prevBtn = document.getElementById('prevBtn');
  const restartBtn = document.getElementById('restartBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');

  const questionCategory = document.getElementById('questionCategory');
  const stepCounter = document.getElementById('stepCounter');
  const progressFill = document.getElementById('progressFill');
  const questionText = document.getElementById('questionText');
  const questionHint = document.getElementById('questionHint');
  const optionsList = document.getElementById('optionsList');

  // ==========================================
  // 4. 이벤트 리스너 & 화면 전환
  // ==========================================
  function startQuiz() {
    introSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    quizSection.classList.remove('hidden');

    currentStep = 0;
    userAnswers = [];
    renderQuestion(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  startTestBtn.addEventListener('click', startQuiz);
  navStartBtn.addEventListener('click', (e) => {
    e.preventDefault();
    startQuiz();
  });

  restartBtn.addEventListener('click', startQuiz);

  // 이전 질문 버튼
  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      userAnswers.pop();
      renderQuestion(currentStep);
    }
  });

  // 링크 복사 버튼
  copyLinkBtn.addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert("✨ 진단 페이지 링크가 클립보드에 복사되었습니다! 친구에게 공유해 보세요.");
      }).catch(() => {
        prompt("아래 링크를 복사하여 공유하세요:", url);
      });
    } else {
      prompt("아래 링크를 복사하여 공유하세요:", url);
    }
  });

  // ==========================================
  // 5. 질문 렌더링 함수
  // ==========================================
  function renderQuestion(index) {
    const q = questions[index];
    if (!q) return;

    // 프로그레스 바 및 카운터
    const percent = ((index + 1) / questions.length) * 100;
    progressFill.style.width = `${percent}%`;
    stepCounter.textContent = `문항 ${index + 1} / ${questions.length}`;
    questionCategory.textContent = q.category;

    // 이전 버튼 보임 여부
    if (index === 0) {
      prevBtn.classList.add('hidden');
    } else {
      prevBtn.classList.remove('hidden');
    }

    // 질문 및 힌트 설정
    questionText.textContent = q.question;
    questionHint.textContent = q.hint;

    // 선택지 버튼 생성
    optionsList.innerHTML = '';
    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.innerHTML = `
        <div class="option-content">
          <span class="option-num">${String.fromCharCode(65 + optIndex)}</span>
          <span class="option-label">${opt.text}</span>
        </div>
        <span class="option-arrow">›</span>
      `;
      btn.addEventListener('click', () => handleOptionClick(opt));
      optionsList.appendChild(btn);
    });
  }

  // 선택지 클릭 처리
  function handleOptionClick(opt) {
    userAnswers.push(opt);
    currentStep++;

    if (currentStep < questions.length) {
      renderQuestion(currentStep);
    } else {
      processDiagnosis();
    }
  }

  // ==========================================
  // 6. 결과 계산 및 분석 연출
  // ==========================================
  function processDiagnosis() {
    quizSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 로딩 메시지 순차 애니메이션
    const loadingMsg = document.getElementById('loadingMsg');
    const messages = [
      "8가지 정밀 문항의 유수분 데이터를 집계하는 중...",
      "피지 분비율, 속당김, 장벽 민감도 지수를 다각도로 분석 중...",
      "내 피부 타입에 꼭 맞는 찰떡 성분과 주의 성분을 매칭하고 있어요!"
    ];

    let msgIndex = 0;
    const interval = setInterval(() => {
      msgIndex++;
      if (msgIndex < messages.length) {
        loadingMsg.textContent = messages[msgIndex];
      }
    }, 450);

    // 1.35초 후 결과 화면 렌더링
    setTimeout(() => {
      clearInterval(interval);
      loadingSection.classList.add('hidden');
      resultSection.classList.remove('hidden');
      renderResult();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 1350);
  }

  function renderResult() {
    // 1) 3축 점수 총합 계산
    let totalOil = 0;
    let totalMoist = 0;
    let totalSens = 0;

    userAnswers.forEach(ans => {
      totalOil += ans.oil;
      totalMoist += ans.moist;
      totalSens += ans.sens;
    });

    // 2) 0~10 스케일로 정규화 (가중치 최대치 기반 보정)
    // 8문항 최대 점수 기준: Oil 약 65~70점, Moist 약 65~70점, Sens 약 55~60점
    const normOil = Math.min(10, Math.max(1, Math.round((totalOil / 60) * 10)));
    const normMoist = Math.min(10, Math.max(1, Math.round((totalMoist / 55) * 10)));
    const normSens = Math.min(10, Math.max(1, Math.round((totalSens / 45) * 10)));

    // 3) 알고리즘 분기 트리 (6대 타입 판정)
    let typeKey = "combination";

    if (normSens >= 6) {
      // 민감도가 높을 때
      typeKey = (normOil >= 6) ? "sensitive_oily" : "sensitive_dry";
    } else {
      // 일반 민감도일 때
      if (normOil >= 7) {
        typeKey = "oily";
      } else if (normOil <= 3) {
        typeKey = "dry";
      } else {
        // 중간 유분 (수부지 vs 복합성)
        typeKey = (normMoist >= 6) ? "dehydrated_oily" : "combination";
      }
    }

    const typeData = skinDatabase[typeKey];

    // 4) UI 데이터 바인딩
    document.getElementById('resultBadge').textContent = typeData.badge;
    document.getElementById('resultTitle').textContent = typeData.name;
    document.getElementById('resultDesc').textContent = typeData.desc;

    // 점수 텍스트 & 게이지 바 반영
    document.getElementById('sebumScoreText').textContent = `${normOil} / 10`;
    document.getElementById('sebumScoreBar').style.width = `${normOil * 10}%`;
    document.getElementById('sebumComment').textContent = typeData.oilComment;

    document.getElementById('moistureScoreText').textContent = `${normMoist} / 10`;
    document.getElementById('moistureScoreBar').style.width = `${normMoist * 10}%`;
    document.getElementById('moistureComment').textContent = typeData.moistComment;

    document.getElementById('sensScoreText').textContent = `${normSens} / 10`;
    document.getElementById('sensScoreBar').style.width = `${normSens * 10}%`;
    document.getElementById('sensComment').textContent = typeData.sensComment;

    // 추천 성분 BEST 3
    const goodList = document.getElementById('goodIngredientsList');
    goodList.innerHTML = typeData.good.map(item => `
      <li>
        <strong>${item.name}</strong>
        <span>${item.desc}</span>
      </li>
    `).join('');

    // 주의 성분 WORST 2
    const badList = document.getElementById('badIngredientsList');
    badList.innerHTML = typeData.bad.map(item => `
      <li>
        <strong>${item.name}</strong>
        <span>${item.desc}</span>
      </li>
    `).join('');

    // 루틴 팁
    document.getElementById('routineTipText').textContent = typeData.routine;
  }
});
