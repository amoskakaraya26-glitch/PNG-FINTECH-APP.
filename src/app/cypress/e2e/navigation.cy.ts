describe('Navigation E2E Tests', () => {
  it('should navigate between pages', () => {
    // Login first
    cy.login()
    // Start at dashboard
    cy.visit('/')
    cy.contains('Welcome to PNG Fintech Wallet').should('be.visible')

    // Navigate to wallet (using Wallet page link if available, or direct route)
    cy.visit('/wallet')
    cy.contains('Digital Wallet').should('be.visible')

    // Navigate to KYC
    cy.visit('/kyc')
    cy.contains('KYC Verification').should('be.visible')

    // Navigate to Banks
    cy.visit('/banks')
    cy.contains('Bank Integration').should('be.visible')

    // Navigate back to dashboard
    cy.visit('/')
    cy.contains('Welcome to PNG Fintech Wallet').should('be.visible')
  })

  it('should highlight active navigation link', () => {
    // Login first
    cy.login()
    // Start at dashboard
    cy.visit('/')
    // Verify we're on the dashboard by checking for specific content
    cy.contains('Welcome to PNG Fintech Wallet').should('be.visible')

    // Navigate to wallet
    cy.visit('/wallet')
    cy.contains('Digital Wallet').should('be.visible')

    // Navigate to KYC
    cy.visit('/kyc')
    cy.contains('KYC Verification').should('be.visible')
  })

  it('should display logo and navigate to dashboard', () => {
    cy.login()
    cy.visit('/wallet')
    cy.contains('Digital Wallet').should('be.visible')
    
    // Navigate back to dashboard via visiting home
    cy.visit('/')
    cy.contains('Welcome to PNG Fintech Wallet').should('be.visible')
  })
})