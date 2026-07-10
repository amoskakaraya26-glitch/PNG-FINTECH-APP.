describe('Bank Integration E2E Tests', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/banks')
  })

  it('should load banks page', () => {
    cy.contains('Bank Integration').should('be.visible')
    cy.contains('Link your KINA and BSP bank accounts').should('be.visible')
  })

  it('should show bank linking form', () => {
    cy.get('.link-account-section').should('be.visible')
    cy.contains('Link Bank Account').should('be.visible')

    // Check form elements
    cy.get('select[id="bankCode"]').should('be.visible')
    cy.get('input[id="accountNumber"]').should('be.visible')
    cy.get('input[id="accountName"]').should('be.visible')
    cy.get('input[id="pin"]').should('be.visible')
    cy.get('.btn-primary').contains('Link Account').should('be.visible')
  })

  it('should allow selecting different banks', () => {
    // Check default selection
    cy.get('select[id="bankCode"]').should('have.value', 'kina')

    // Change to BSP
    cy.get('select[id="bankCode"]').select('bsp')
    cy.get('select[id="bankCode"]').should('have.value', 'bsp')

    // Change back to KINA
    cy.get('select[id="bankCode"]').select('kina')
    cy.get('select[id="bankCode"]').should('have.value', 'kina')
  })

  it('should link bank account', () => {
    // Fill out the form
    cy.get('select[id="bankCode"]').select('kina')
    cy.get('input[id="accountNumber"]').type('1234567890')
    cy.get('input[id="accountName"]').type('John Doe')
    cy.get('input[id="pin"]').type('1234')

    // Intercept the link request and submit the form
    cy.intercept('POST', '/api/bank/link').as('linkBank')
    cy.get('.btn-primary').contains('Link Account').click()

    // Wait for the backend response and validate
    cy.wait('@linkBank').its('response.statusCode').should('eq', 200)
    cy.contains('Bank account linked successfully!').should('be.visible')
  })

  it('should show linked accounts section', () => {
    cy.get('.linked-accounts-section').should('be.visible')
    cy.contains('Linked Accounts').should('be.visible')
  })

  it('should display supported banks information', () => {
    cy.get('.banks-info').should('be.visible')
    cy.contains('Supported Banks').should('be.visible')
    cy.contains('KINA Bank').should('be.visible')
    cy.contains('Bank South Pacific (BSP)').should('be.visible')
  })

  it('should show account details for linked accounts', () => {
    // This test assumes there's at least one linked account
    cy.get('.account-card').should('be.visible')
    cy.get('.account-info h3').should('be.visible')
    cy.get('.account-number').should('be.visible')
    cy.get('.balance').should('be.visible')
    cy.get('.account-actions .btn').should('be.visible')
  })
})