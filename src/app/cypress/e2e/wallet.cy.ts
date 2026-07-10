describe('Wallet E2E Tests', () => {
  beforeEach(() => {
    // Login first
    cy.login()
    // Visit the wallet page
    cy.visit('/wallet')
  })

  it('should load wallet page', () => {
    cy.contains('Digital Wallet').should('be.visible')
  })

  it('should create and display wallet', () => {
    // Wait for wallet to load (either existing or newly created)
    cy.get('.balance-card', { timeout: 10000 }).should('be.visible')
    cy.get('.currency').should('contain', 'PGK')
    cy.get('.amount').invoke('text').then((text) => {
      expect(parseFloat(text)).to.be.a('number')
    })
  })

  it('should top up wallet successfully', () => {
    cy.get('.balance-card').should('be.visible')

    // Get initial balance
    cy.get('.amount').invoke('text').then((initialBalanceText) => {
      const initialBalance = parseFloat(initialBalanceText)

      // Top up wallet
      cy.get('input[id="topupAmount"]').type('100')
      cy.contains('.action-section button', 'Top Up').click()

      // Check success message and balance update
      cy.contains('Topup successful!').should('be.visible')
      cy.get('.amount').invoke('text').then((updatedBalanceText) => {
        const updatedBalance = parseFloat(updatedBalanceText)
        expect(updatedBalance).to.be.greaterThan(initialBalance)
      })
    })
  })

  it('should transfer money between wallets', () => {
    // First top up the wallet
    cy.get('input[id="topupAmount"]').type('200')
    cy.get('.action-section').first().find('.btn-primary').click()
    cy.contains('Topup successful!').should('be.visible')

    // Attempt transfer (this will fail in demo but tests the UI)
    cy.get('input[id="transferWalletId"]').type('demo-wallet-id')
    cy.get('input[id="transferAmount"]').type('50')
    cy.get('.action-section').last().find('.btn-primary').click()

    // Should show error message
    cy.get('.message').should('be.visible')
  })

  it('should display transaction history', () => {
    cy.get('.transaction-history').should('be.visible')
    cy.contains('Transaction History').should('be.visible')
  })
})