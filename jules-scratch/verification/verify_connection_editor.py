
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Handle all alerts automatically by accepting them
    page.on("dialog", lambda dialog: dialog.accept())

    page.goto("http://localhost:5173/")

    # --- Setup: Add people ---

    # Open person editor
    page.get_by_alt_text("Toggle interactive").click()
    name_input = page.get_by_label("Name:")

    # Add Alice
    name_input.fill("Alice")
    page.get_by_role("button", name="Add Node").click()

    # Add Bob
    name_input.fill("Bob")
    page.get_by_role("button", name="Add Node").click()

    # --- Setup: Add connection ---

    # Open connection editor
    page.get_by_alt_text("Toggle connection editor").click()
    from_person_dropdown = page.get_by_label("From Person:")
    expect(from_person_dropdown).to_contain_text("Alice")
    expect(from_person_dropdown).to_contain_text("Bob")
    from_person_dropdown.select_option("Alice")
    page.get_by_label("To Person:").select_option("Bob")
    page.get_by_role("button", name="Add Connection").click()

    # --- Verification of the implemented feature ---

    # 1. Switch to the Edit tab and select the connection
    page.get_by_role("button", name="Edit").click()
    page.get_by_label("Person 1:").select_option("Alice")
    page.get_by_label("Person 2:").select_option("Bob")

    # Verify that the edit form is now visible
    strength_editor = page.get_by_label("Strength:")
    expect(strength_editor).to_be_visible()
    page.screenshot(path="jules-scratch/verification/01-connection-selected.png")

    # 2. Edit the connection's strength
    strength_editor.select_option("strong")
    page.screenshot(path="jules-scratch/verification/02-strength-changed.png")
    page.get_by_role("button", name="Save Changes").click()
    # The alert is handled automatically by the handler

    # 3. Verify that the change was saved
    # Reselect the connection to check if the new value persisted
    page.get_by_label("Person 1:").select_option("") # Deselect first
    page.get_by_label("Person 1:").select_option("Alice")
    page.get_by_label("Person 2:").select_option("Bob")
    expect(strength_editor).to_have_value("strong")
    page.screenshot(path="jules-scratch/verification/03-changes-saved.png")

    # 4. Delete the connection
    page.get_by_role("button", name="Delete Connection").click()
    # The alert is handled automatically

    # 5. Verify that the connection was deleted
    # The edit form should no longer be visible
    expect(strength_editor).not_to_be_visible()
    # The person selection dropdowns should be reset
    expect(page.get_by_label("Person 1:")).to_have_value("")
    expect(page.get_by_label("Person 2:")).to_have_value("")
    page.screenshot(path="jules-scratch/verification/04-connection-deleted.png")

    # --- Cleanup ---
    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
