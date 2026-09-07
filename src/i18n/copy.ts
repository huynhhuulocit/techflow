import type { Locale } from '../content/types'

export type AppCopy = {
  language: {
    label: string
    vietnamese: string
    english: string
  }
  common: {
    home: string
    library: string
    minutes: (minutes: number) => string
    level: Record<'Cơ bản' | 'Trung cấp' | 'Nâng cao', string>
  }
  home: {
    navLabel: string
    openMenu: string
    closeMenu: string
    explore: string
    roadmap: string
    roadmapUnavailable: string
    interview: string
    heroBadge: string
    heroTitleLead: string
    heroTitleAccent: string
    heroDescription: string
    searchPlaceholder: string
    searchAction: string
    stats: {
      questions: string
      topics: string
      levels: string
      answerLayers: string
    }
    libraryEyebrow: string
    libraryTitle: string
    categoryFilterLabel: string
    allCategories: string
    startLesson: string
    interviewLoading: string
    authorStudio: string
    authorStudioLoading: string
  }
  lesson: {
    contentLabel: string
    sections: string[]
    visualLesson: string
    quickAnswer: string
    overviewTitle: string
    overviewDescription: string
    simulationPending: string
    followUps: string
  }
  workflow: {
    label: string
    title: string
    step: (current: number, total: number) => string
    restart: string
    nextStep: string
    play: string
    pause: string
  }
  search: {
    back: string
    inputLabel: string
    results: (count: number) => string
    eyebrow: string
    title: (query: string) => string
    description: string
    synthesized: string
    synthesisNote: (concepts: number, lessons: number) => string
    relationHintTitle: string
    relationHintBody: string
    relatedLessons: string
    rankedByRelevance: string
    matched: string
    noResultsTitle: string
    noResultsBody: string
    suggestionsTitle: string
    defaultSuggestions: string[]
  }
  interview: {
    homeLabel: string
    backToExplore: string
    backToList: string
    bankAria: string
    heroTitle: string
    heroDescription: string
    vietnameseCoverage: string
    englishCoverage: string
    technicalReviewTitle: (count: number) => string
    translationReviewTitle: (count: number) => string
    technicalReviewBody: string
    translationReviewBody: string
    filterTitle: string
    reset: string
    keyword: string
    searchPlaceholder: string
    topic: string
    allTopics: string
    level: string
    allLevels: string
    resultsEyebrow: string
    questionCount: (count: number) => string
    showing: (first: number, last: number, total: number) => string
    pendingReview: string
    technicalReviewBadge: string
    translationReviewBadge: string
    viewAnswer: string
    emptyTitle: string
    emptyBody: string
    clearFilters: string
    pagination: string
    previousPage: string
    nextPage: string
    page: (page: number, total?: number) => string
    breadcrumbs: string
    questionNumber: (position: number) => string
    answerGuide: string
    technicalPending: string
    translationPending: string
    technicalPendingBody: string
    translationPendingBody: string
    learningPath: string
    learningSections: {
      quickEyebrow: string
      quickTitle: string
      conceptEyebrow: string
      conceptTitle: string
      tradeoffEyebrow: string
      tradeoffTitle: string
      exampleEyebrow: string
      exampleTitle: string
    }
    sourceLabel: string
    importSource: string
    anchor: string
    reviewed: string
    navigation: string
    wholeLibrary: string
    previousQuestion: string
    nextQuestion: string
    missingTitle: string
    missingBody: string
    browseAvailable: string
    loading: string
    loadErrorTitle: string
    loadErrorBody: string
    retry: string
    openInStudio: string
    openInStudioDescription: string
  }
}

export const copyByLocale = {
  vi: {
    language: {
      label: 'Chọn ngôn ngữ',
      vietnamese: 'Tiếng Việt',
      english: 'English',
    },
    common: {
      home: 'Trang chủ',
      library: 'Thư viện',
      minutes: minutes => `${minutes} phút`,
      level: {
        'Cơ bản': 'Cơ bản',
        'Trung cấp': 'Trung cấp',
        'Nâng cao': 'Nâng cao',
      },
    },
    home: {
      navLabel: 'Điều hướng chính',
      openMenu: 'Mở menu chính',
      closeMenu: 'Đóng menu chính',
      explore: 'Khám phá',
      roadmap: 'Lộ trình',
      roadmapUnavailable: 'Tính năng đang được xây dựng',
      interview: 'Luyện phỏng vấn',
      heroBadge: 'HỌC BẰNG CÁCH NHÌN HỆ THỐNG CHẠY',
      heroTitleLead: 'Hiểu sâu kỹ thuật.',
      heroTitleAccent: 'Trả lời phỏng vấn tự tin.',
      heroDescription: 'Animation, workflow và tình huống thực tế giúp bạn biến khái niệm khó thành kiến thức có thể giải thích.',
      searchPlaceholder: 'Thử hỏi: SFCC và PWA TypeScript liên quan thế nào?',
      searchAction: 'Tìm hiểu',
      stats: {
        questions: 'Câu hỏi phỏng vấn',
        topics: 'Chủ đề chuyên sâu',
        levels: 'Cấp độ kinh nghiệm',
        answerLayers: 'Lớp trong mỗi đáp án',
      },
      libraryEyebrow: 'THƯ VIỆN KIẾN THỨC',
      libraryTitle: 'Chọn một chủ đề để bắt đầu',
      categoryFilterLabel: 'Lọc bài học theo chủ đề',
      allCategories: 'Tất cả',
      startLesson: 'Học ngay',
      interviewLoading: 'Đang mở ngân hàng câu hỏi…',
      authorStudio: 'Question Studio',
      authorStudioLoading: 'Đang mở Question Studio…',
    },
    lesson: {
      contentLabel: 'NỘI DUNG BÀI HỌC',
      sections: ['Trả lời nhanh', 'Hiểu bản chất', 'Mô phỏng workflow', 'Câu hỏi đào sâu'],
      visualLesson: 'Bài học trực quan',
      quickAnswer: 'TRẢ LỜI TRONG 30 GIÂY',
      overviewTitle: 'Bức tranh tổng quan',
      overviewDescription: 'Thay vì chỉ ghi nhớ định nghĩa, hãy theo dõi các actor, trạng thái và bước chuyển trong cơ chế. Cách nhìn này giúp bạn giải thích rõ nguyên nhân, kết quả và production trade-off.',
      simulationPending: 'Mô phỏng cho bài này đang được xây dựng.',
      followUps: 'INTERVIEWER CÓ THỂ HỎI TIẾP',
    },
    workflow: {
      label: 'MÔ PHỎNG TƯƠNG TÁC',
      title: 'Quan sát từng bước',
      step: (current, total) => `Bước ${current}/${total}`,
      restart: 'Chạy lại',
      nextStep: 'Bước tiếp',
      play: 'Chạy mô phỏng',
      pause: 'Tạm dừng',
    },
    search: {
      back: 'Trang chủ',
      inputLabel: 'Tìm trong thư viện kiến thức',
      results: count => `${count.toLocaleString('vi-VN')} kết quả`,
      eyebrow: 'TÌM TRONG KNOWLEDGE GRAPH',
      title: query => `Kết quả cho “${query}”`,
      description: 'Không chỉ khớp từ khóa — TechFlow tìm khái niệm và đường kết nối giữa chúng.',
      synthesized: 'CÂU TRẢ LỜI TỔNG HỢP',
      synthesisNote: (concepts, lessons) => `Câu trả lời được tổng hợp từ ${concepts} khái niệm và ${lessons} bài học liên quan.`,
      relationHintTitle: 'Tìm thấy nhiều khái niệm liên quan',
      relationHintBody: 'Mở các bài bên dưới để hiểu từng khái niệm. Khi knowledge graph có quan hệ trực tiếp, phần tổng hợp sẽ xuất hiện tại đây.',
      relatedLessons: 'BÀI HỌC LIÊN QUAN',
      rankedByRelevance: 'Xếp theo mức độ phù hợp',
      matched: 'Khớp:',
      noResultsTitle: 'Chưa tìm thấy nội dung phù hợp',
      noResultsBody: 'Thử dùng tên công nghệ, khái niệm hoặc mô tả vấn đề cụ thể hơn.',
      suggestionsTitle: 'Bạn có thể hỏi tiếp',
      defaultSuggestions: [
        'Event Loop liên quan gì đến Promise?',
        'JWT và Session nên chọn cái nào?',
        'RAG sử dụng Vector Database ra sao?',
      ],
    },
    interview: {
      homeLabel: 'Về trang chủ TechFlow',
      backToExplore: 'Khám phá bài học',
      backToList: 'Danh sách câu hỏi',
      bankAria: 'Danh sách câu hỏi phỏng vấn',
      heroTitle: 'Luyện cách trả lời, không chỉ học thuộc đáp án.',
      heroDescription: 'Chọn chủ đề và level phù hợp. Mỗi câu hỏi đi từ câu trả lời nhanh đến cơ chế, production trade-off và ví dụ được import từ tài liệu GameStream.',
      vietnameseCoverage: 'Đầy đủ 585 câu tiếng Việt',
      englishCoverage: 'Hiện có 45/585 câu bằng English',
      technicalReviewTitle: count => `${count.toLocaleString('vi-VN')} câu đang chờ technical review`,
      translationReviewTitle: count => `${count.toLocaleString('vi-VN')} bản dịch đang chờ review`,
      technicalReviewBody: 'Nội dung import không được tự động xem là đã kiểm chứng; chỉ các câu có evidence hợp lệ mới được đánh dấu đã review.',
      translationReviewBody: 'Bản English được AI hỗ trợ dịch và chỉ hiển thị những câu đã có bản dịch; không tự động thay thế bằng nội dung tiếng Việt.',
      filterTitle: 'Lọc câu hỏi',
      reset: 'Đặt lại',
      keyword: 'Tìm theo từ khóa',
      searchPlaceholder: 'Ví dụ: Redis cache, JWT, WebRTC...',
      topic: 'Chủ đề',
      allTopics: 'Tất cả chủ đề',
      level: 'Level',
      allLevels: 'Tất cả',
      resultsEyebrow: 'KẾT QUẢ PHÙ HỢP',
      questionCount: count => `${count.toLocaleString('vi-VN')} câu hỏi`,
      showing: (first, last, total) => `Đang hiển thị ${first}–${last} trên ${total.toLocaleString('vi-VN')}`,
      pendingReview: 'Chờ review',
      technicalReviewBadge: 'Chờ technical review',
      translationReviewBadge: 'Chờ translation review',
      viewAnswer: 'Xem đáp án',
      emptyTitle: 'Chưa tìm thấy câu hỏi phù hợp',
      emptyBody: 'Thử từ khóa ngắn hơn hoặc thay đổi topic và level.',
      clearFilters: 'Xóa bộ lọc',
      pagination: 'Phân trang câu hỏi phỏng vấn',
      previousPage: 'Trang trước',
      nextPage: 'Trang sau',
      page: (page, total) => total ? `Trang ${page} / ${total}` : `Trang ${page}`,
      breadcrumbs: 'Luyện phỏng vấn',
      questionNumber: position => `Câu ${String(position).padStart(2, '0')}`,
      answerGuide: 'Đi qua bốn lớp dưới đây để biến đáp án thành một cách giải thích có cấu trúc.',
      technicalPending: 'Nội dung đang chờ technical review',
      translationPending: 'Bản dịch đang chờ technical và translation review',
      technicalPendingBody: 'Câu trả lời được nhập từ tài liệu GameStream và chưa được TechFlow xác nhận là nội dung đã kiểm chứng.',
      translationPendingBody: 'Bản English được AI hỗ trợ dịch từ câu hỏi GameStream và chưa được TechFlow xác nhận là bản dịch đã kiểm chứng.',
      learningPath: 'Nội dung trả lời phỏng vấn',
      learningSections: {
        quickEyebrow: 'TRẢ LỜI NHANH',
        quickTitle: 'Kết luận trước, đủ rõ để nói trong phỏng vấn',
        conceptEyebrow: 'HIỂU BẢN CHẤT',
        conceptTitle: 'Cơ chế hoạt động phía sau',
        tradeoffEyebrow: 'PRODUCTION TRADE-OFF',
        tradeoffTitle: 'Điều phải cân nhắc khi áp dụng thực tế',
        exampleEyebrow: 'VÍ DỤ TRONG GAMESTREAM',
        exampleTitle: 'Cách khái niệm xuất hiện trong hệ thống',
      },
      sourceLabel: 'Nguồn nội dung',
      importSource: 'Nguồn import',
      anchor: 'Anchor',
      reviewed: 'Đã review',
      navigation: 'Điều hướng giữa các câu hỏi',
      wholeLibrary: 'Trong toàn bộ thư viện',
      previousQuestion: 'Câu trước',
      nextQuestion: 'Câu tiếp theo',
      missingTitle: 'Câu hỏi này chưa có bản English',
      missingBody: 'TechFlow không tự động hiển thị nội dung tiếng Việt thay cho locale đang chọn. Bạn có thể xem các câu English hiện có hoặc chuyển lại VI.',
      browseAvailable: 'Xem câu English hiện có',
      loading: 'Đang tải câu hỏi theo ngôn ngữ…',
      loadErrorTitle: 'Không thể tải ngân hàng câu hỏi',
      loadErrorBody: 'Đã xảy ra lỗi khi tải nội dung theo ngôn ngữ đang chọn.',
      retry: 'Thử lại',
      openInStudio: 'Tạo animation bằng AI',
      openInStudioDescription: 'Mở câu hỏi này thành một draft trong Question Studio. AI chỉ tạo simulation spec cần review và không sửa nội dung đã publish.',
    },
  },
  en: {
    language: {
      label: 'Choose language',
      vietnamese: 'Vietnamese',
      english: 'English',
    },
    common: {
      home: 'Home',
      library: 'Library',
      minutes: minutes => `${minutes} min`,
      level: {
        'Cơ bản': 'Beginner',
        'Trung cấp': 'Intermediate',
        'Nâng cao': 'Advanced',
      },
    },
    home: {
      navLabel: 'Primary navigation',
      openMenu: 'Open primary menu',
      closeMenu: 'Close primary menu',
      explore: 'Explore',
      roadmap: 'Roadmap',
      roadmapUnavailable: 'This feature is being built',
      interview: 'Interview practice',
      heroBadge: 'LEARN BY WATCHING SYSTEMS RUN',
      heroTitleLead: 'Understand technology deeply.',
      heroTitleAccent: 'Answer interviews confidently.',
      heroDescription: 'Animations, workflows, and production scenarios turn difficult concepts into knowledge you can explain clearly.',
      searchPlaceholder: 'Try asking: How are SFCC, PWA Kit, and TypeScript related?',
      searchAction: 'Explore',
      stats: {
        questions: 'English question coverage',
        topics: 'Canonical topics',
        levels: 'Experience levels',
        answerLayers: 'Layers in every answer',
      },
      libraryEyebrow: 'KNOWLEDGE LIBRARY',
      libraryTitle: 'Choose a topic to get started',
      categoryFilterLabel: 'Filter lessons by topic',
      allCategories: 'All',
      startLesson: 'Start lesson',
      interviewLoading: 'Opening the question bank…',
      authorStudio: 'Question Studio',
      authorStudioLoading: 'Opening Question Studio…',
    },
    lesson: {
      contentLabel: 'LESSON CONTENT',
      sections: ['Quick answer', 'Understand the mechanism', 'Workflow simulation', 'Follow-up questions'],
      visualLesson: 'Visual lesson',
      quickAnswer: '30-SECOND ANSWER',
      overviewTitle: 'The big picture',
      overviewDescription: 'Instead of memorizing a definition, follow the actors, state, and transitions in the mechanism. This mental model helps you explain causes, outcomes, and production trade-offs.',
      simulationPending: 'A simulation for this lesson is being built.',
      followUps: 'THE INTERVIEWER MAY ASK NEXT',
    },
    workflow: {
      label: 'INTERACTIVE SIMULATION',
      title: 'Follow each step',
      step: (current, total) => `Step ${current}/${total}`,
      restart: 'Restart',
      nextStep: 'Next step',
      play: 'Run simulation',
      pause: 'Pause',
    },
    search: {
      back: 'Home',
      inputLabel: 'Search the knowledge library',
      results: count => `${count.toLocaleString('en-US')} result${count === 1 ? '' : 's'}`,
      eyebrow: 'SEARCH THE KNOWLEDGE GRAPH',
      title: query => `Results for “${query}”`,
      description: 'TechFlow goes beyond keyword matching to find concepts and the connections between them.',
      synthesized: 'SYNTHESIZED ANSWER',
      synthesisNote: (concepts, lessons) => `This answer combines ${concepts} concepts and ${lessons} related lesson${lessons === 1 ? '' : 's'}.`,
      relationHintTitle: 'Several related concepts found',
      relationHintBody: 'Open the lessons below to understand each concept. A synthesis appears here when the knowledge graph has a direct relationship.',
      relatedLessons: 'RELATED LESSONS',
      rankedByRelevance: 'Ranked by relevance',
      matched: 'Matched:',
      noResultsTitle: 'No matching content found',
      noResultsBody: 'Try a technology name, a concept, or a more specific problem description.',
      suggestionsTitle: 'Questions to explore next',
      defaultSuggestions: [
        'How does the Event Loop relate to Promise?',
        'When should I choose JWT or Session?',
        'How does RAG use a Vector Database?',
      ],
    },
    interview: {
      homeLabel: 'Go to the TechFlow home page',
      backToExplore: 'Explore lessons',
      backToList: 'Question list',
      bankAria: 'Interview question list',
      heroTitle: 'Practice explaining, not memorizing answers.',
      heroDescription: 'Choose a topic and experience level. Every question moves from a quick answer to the mechanism, production trade-offs, and an example imported from the GameStream material.',
      vietnameseCoverage: 'All 585 Vietnamese questions available',
      englishCoverage: '45 of 585 questions currently available in English',
      technicalReviewTitle: count => `${count.toLocaleString('en-US')} question${count === 1 ? '' : 's'} awaiting technical review`,
      translationReviewTitle: count => `${count.toLocaleString('en-US')} English translation${count === 1 ? '' : 's'} awaiting language review`,
      technicalReviewBody: 'Imported content is not treated as verified automatically; only questions with valid evidence can be marked reviewed.',
      translationReviewBody: 'English copies were translated with AI assistance and remain unverified. Only available translations are shown, with no silent fallback to Vietnamese.',
      filterTitle: 'Filter questions',
      reset: 'Reset',
      keyword: 'Search by keyword',
      searchPlaceholder: 'For example: type guard, generic, runtime...',
      topic: 'Topic',
      allTopics: 'All topics',
      level: 'Level',
      allLevels: 'All',
      resultsEyebrow: 'MATCHING RESULTS',
      questionCount: count => `${count.toLocaleString('en-US')} question${count === 1 ? '' : 's'}`,
      showing: (first, last, total) => `Showing ${first}–${last} of ${total.toLocaleString('en-US')}`,
      pendingReview: 'Technical + translation review pending',
      technicalReviewBadge: 'Technical review pending',
      translationReviewBadge: 'Translation review pending',
      viewAnswer: 'View answer',
      emptyTitle: 'No matching questions found',
      emptyBody: 'Only the 45 translated TypeScript questions are available in this pilot. Try another keyword, TypeScript, or a different level.',
      clearFilters: 'Clear filters',
      pagination: 'Interview question pagination',
      previousPage: 'Previous page',
      nextPage: 'Next page',
      page: (page, total) => total ? `Page ${page} of ${total}` : `Page ${page}`,
      breadcrumbs: 'Interview practice',
      questionNumber: position => `Question ${String(position).padStart(2, '0')}`,
      answerGuide: 'Move through the four layers below to turn the answer into a structured explanation.',
      technicalPending: 'Content awaiting technical review',
      translationPending: 'English translation awaiting language review',
      technicalPendingBody: 'This answer was imported from the GameStream material and has not been verified by TechFlow.',
      translationPendingBody: 'This AI-assisted English translation has not passed language review. Translation approval is tracked separately from the source answer’s technical review.',
      learningPath: 'Interview answer content',
      learningSections: {
        quickEyebrow: 'QUICK ANSWER',
        quickTitle: 'Lead with the conclusion in an interview-ready answer',
        conceptEyebrow: 'UNDERSTAND THE MECHANISM',
        conceptTitle: 'How the mechanism works',
        tradeoffEyebrow: 'PRODUCTION TRADE-OFF',
        tradeoffTitle: 'What to consider before using it in production',
        exampleEyebrow: 'GAMESTREAM EXAMPLE',
        exampleTitle: 'Where the concept appears in the system',
      },
      sourceLabel: 'Content source',
      importSource: 'Imported from',
      anchor: 'Anchor',
      reviewed: 'Reviewed',
      navigation: 'Navigate between questions',
      wholeLibrary: 'Across the available English library',
      previousQuestion: 'Previous question',
      nextQuestion: 'Next question',
      missingTitle: 'This question is not available in English yet',
      missingBody: 'TechFlow does not silently substitute Vietnamese content for the selected locale. Browse the available English questions or switch back to VI.',
      browseAvailable: 'Browse available English questions',
      loading: 'Loading questions for this language…',
      loadErrorTitle: 'Unable to load the question bank',
      loadErrorBody: 'Something went wrong while loading content for the selected language.',
      retry: 'Try again',
      openInStudio: 'Generate an AI animation',
      openInStudioDescription: 'Open this question as a draft in Question Studio. AI only creates a review-required simulation spec and never changes published content.',
    },
  },
} satisfies Record<Locale, AppCopy>
