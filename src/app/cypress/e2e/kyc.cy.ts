describe('KYC E2E Tests', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/kyc')
  })

  it('should load KYC page', () => {
    cy.contains('KYC Verification').should('be.visible')
    cy.contains('Verify your identity with Savis digital ID').should('be.visible')
  })

  it('should show KYC initiation form', () => {
    cy.get('.kyc-initiate').should('be.visible')
    cy.contains('Start KYC Verification').should('be.visible')

    // Check form fields
    cy.get('input[id="name"]').should('be.visible')
    cy.get('input[id="phone"]').should('be.visible')
    cy.get('.btn-primary').contains('Start Verification').should('be.visible')
  })

  it('should initiate KYC verification', () => {
    // Fill out the form
    cy.get('input[id="name"]').type('John Doe')
    cy.get('input[id="phone"]').type('+67570000000')

    // Submit the form
    cy.get('.btn-primary').contains('Start Verification').click()

    // Should show success message
    cy.contains('KYC verification initiated!').should('be.visible')
  })

  it('should show verification form after initiation', () => {
    // First initiate verification
    cy.get('input[id="name"]').type('Jane Smith')
    cy.get('input[id="phone"]').type('+67570000001')
    cy.get('.btn-primary').contains('Start Verification').click()

    // Should show verification form
    cy.get('.kyc-verify').should('be.visible')
    cy.contains('Complete Verification').should('be.visible')
    cy.get('input[id="verificationCode"]').should('be.visible')
  })

  it('should complete KYC verification', () => {
    // Initiate verification
    cy.get('input[id="name"]').type('Test User')
    cy.get('input[id="phone"]').type('+67570000002')
    cy.get('.btn-primary').contains('Start Verification').click()

    // Enter verification code
    cy.get('input[id="verificationCode"]').type('123456')
    cy.get('.btn-primary').contains('Verify Identity').click()

    // Should show success message
    cy.contains('KYC verification successful!').should('be.visible')
  })

  it('should show KYC information section', () => {
    cy.get('.kyc-info').should('be.visible')
    cy.contains('Why KYC?').should('be.visible')
    cy.contains('Enhanced security for your transactions').should('be.visible')
  })
})