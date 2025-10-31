from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5173/")

    # Click the display panel button
    display_button = page.get_by_alt_text("Toggle display settings")
    display_button.click()

    # Ensure the panel is visible
    expect(page.locator("h2", has_text="Display Settings")).to_be_visible()

    # Find the first name input and type into it
    name_input = page.locator('input[type="text"]').first
    name_input.click()
    name_input.type("new_name")

    # Take a screenshot to verify the input has focus and the value has changed
    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
