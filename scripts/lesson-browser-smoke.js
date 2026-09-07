/* global document, window */
async page => {
  const failures = []
  const browserErrors = []
  const assert = (condition, message) => {
    if (!condition) failures.push(message)
  }
  const noHorizontalOverflow = () => page.evaluate(() => (
    document.documentElement.scrollWidth <= document.documentElement.clientWidth
  ))
  const openVietnameseLesson = async (viewport) => {
    await page.setViewportSize(viewport)
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => window.localStorage.clear())
    await page.reload({ waitUntil: 'domcontentloaded' })

    const lessonButton = page.getByRole('button', { name: /PWA Kit hoạt động trong kiến trúc SFCC/ })
    await lessonButton.scrollIntoViewIfNeeded()
    await lessonButton.click()
    await page.getByRole('heading', {
      level: 1,
      name: 'PWA Kit hoạt động trong kiến trúc SFCC ra sao?',
    }).waitFor()
  }

  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', error => browserErrors.push(error.message))

  await openVietnameseLesson({ width: 1280, height: 800 })
  const desktopScenario = page.getByRole('combobox', { name: 'Scenario' })
  await desktopScenario.selectOption('cache-hit-add-to-cart')
  await page.getByRole('button', { name: 'Đi tới bước tiếp theo' }).click()
  await page.getByRole('heading', { level: 3, name: 'Mở PDP trực tiếp' }).waitFor()
  assert(
    await page.getByText('document-request', { exact: true }).isVisible(),
    'Desktop simulation did not expose the first deterministic state.',
  )
  const desktopFollowUp = page.getByRole('link', { name: /4.*Câu hỏi đào sâu/ })
  assert(await desktopFollowUp.isVisible(), 'Desktop table of contents is not visible.')
  await desktopFollowUp.click()
  await page.waitForFunction(() => (
    document.querySelector('a[href="#lesson-follow-ups"]')?.getAttribute('aria-current') === 'location'
  ))
  assert(
    await desktopFollowUp.getAttribute('aria-current') === 'location',
    'Desktop table of contents did not activate the final section.',
  )
  assert(await noHorizontalOverflow(), 'Desktop lesson has horizontal overflow.')

  await openVietnameseLesson({ width: 390, height: 844 })
  const mobileJumpMenu = page.getByRole('combobox', { name: 'NỘI DUNG BÀI HỌC' })
  assert(await mobileJumpMenu.isVisible(), 'Mobile jump menu is not visible.')
  await mobileJumpMenu.selectOption('lesson-simulation')
  const mobileMenuAtSimulation = await page.locator('.lesson-mobile-toc').boundingBox()
  const simulationHeaderBox = await page.locator('.simulation-player__header').boundingBox()
  assert(
    mobileMenuAtSimulation !== null
      && simulationHeaderBox !== null
      && simulationHeaderBox.y >= mobileMenuAtSimulation.y + mobileMenuAtSimulation.height,
    'Mobile jump menu overlaps the simulation heading.',
  )
  const mobileScenario = page.getByRole('combobox', { name: 'Scenario' })
  await mobileScenario.selectOption('unsafe-personalized-shared-cache')
  const mobileNext = page.getByRole('button', { name: 'Đi tới bước tiếp theo' })
  await mobileNext.click()
  await mobileNext.click()
  await mobileNext.click()
  assert(
    await page.locator('.simulation-player__terminal--failed').isVisible(),
    'Mobile failure scenario did not reach its failed terminal state.',
  )
  await mobileJumpMenu.selectOption('lesson-follow-ups')
  await page.waitForFunction(() => (
    document.querySelector('#lesson-section-select')?.value === 'lesson-follow-ups'
  ))
  const mobileMenuBox = await page.locator('.lesson-mobile-toc').boundingBox()
  assert(
    mobileMenuBox !== null && mobileMenuBox.y >= -1 && mobileMenuBox.y + mobileMenuBox.height <= 845,
    'Mobile jump menu is not visible after navigating to the final section.',
  )
  assert(await noHorizontalOverflow(), 'Mobile lesson has horizontal overflow.')

  const openAuthorStudio = page.getByRole('button', { name: 'Tạo lại bằng AI' })
  assert(await openAuthorStudio.isVisible(), 'Rich lesson AI Simulation Studio is not available in local development.')
  await openAuthorStudio.click()
  await page.getByLabel('Author Token').waitFor()
  assert(await noHorizontalOverflow(), 'Open AI Simulation Studio has horizontal overflow at 390px.')
  await page.getByRole('button', { name: 'Generate preview' }).click()
  assert(
    await page.getByText('Hãy nhập Author Token trước khi gọi AI.').isVisible(),
    'Missing Author Token did not fail safely inside the lesson author panel.',
  )

  await page.setViewportSize({ width: 320, height: 844 })
  assert(await mobileJumpMenu.isVisible(), 'Mobile jump menu is not visible at 320px.')
  assert(await page.getByLabel('Author Token').isVisible(), 'AI Simulation Studio controls are not visible at 320px.')
  assert(await noHorizontalOverflow(), 'Lesson or AI Simulation Studio has horizontal overflow at 320px.')
  assert(browserErrors.length === 0, `Browser console/page errors: ${browserErrors.join(' | ')}`)

  if (failures.length) throw new Error(failures.join('\n'))
  return {
    desktop: 'simulation state, TOC navigation, and overflow passed',
    mobile: 'failure scenario, sticky jump menu, AI author panel, and overflow passed',
    browserErrors: browserErrors.length,
  }
}
