/// <reference types="cypress" />

// Custom login command for testing  
// Mocks auth to bypass backend validation while testing UI
Cypress.Commands.add('login', (phone = '+675111111111', pin = '1234') => {
  // Intercept the getProfile API call and return mock data
  cy.intercept('GET', '/api/auth/profile', {
    statusCode: 200,
    body: {
      id: 'test-user-' + Date.now(),
      phone,
      full_name: 'Test User',
      is_admin: false,
      kyc_status: 'verified',
      onboarding_completed: true,
      balance: 5000,
      currency: 'PGK',
      avatar_url: null,
      referral_code: 'TEST123',
    },
  }).as('getProfile');
  
  // Set mock token in localStorage
  const mockToken = 'mock-jwt-' + Date.now();
  cy.window().then((win) => {
    win.localStorage.setItem('token', mockToken);
  });
  
  // Visit dashboard - this will trigger getProfile which we've mocked
  cy.visit('/dashboard', { failOnStatusCode: false });
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(phone?: string, pin?: string): Chainable<void>;
    }
  }
}
