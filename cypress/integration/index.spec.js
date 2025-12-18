/// <reference types="Cypress" />

function terminalLog(violations) {
  cy.task(
    'log',
    `${violations.length} accessibility violation${
      violations.length === 1 ? '' : 's'
    } ${violations.length === 1 ? 'was' : 'were'} detected`
  );
  // pluck specific keys to keep the table readable
  const violationData = violations.map(
    ({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      nodes: nodes.length,
    })
  );

  cy.task('table', violationData);
}

describe('Accessibility tests', () => {
  it('Has no detectable accessibility violations on home (light mode)', () => {
    cy.visit('/');
    cy.window().then((win) => {
      win.document.documentElement.removeAttribute('data-theme');
    });
    cy.get('main', { timeout: 10000 })
      .should('be.visible')
      .injectAxe()
      .checkA11y(
        null,
        {
          includedImpacts: ['critical', 'serious'],
        },
        terminalLog
      );
  });

  it('Has no detectable accessibility violations on blog (light mode)', () => {
    cy.visit('/blog');
    cy.window().then((win) => {
      win.document.documentElement.removeAttribute('data-theme');
    });
    cy.get('main', { timeout: 10000 })
      .should('be.visible')
      .injectAxe()
      .checkA11y(
        null,
        {
          includedImpacts: ['critical', 'serious'],
        },
        terminalLog
      );
  });

  it('Has no detectable accessibility violations on home (dark mode)', () => {
    cy.visit('/')
      .get('main')
      .should('be.visible')
      .then(() => {
        cy.window().then((win) => {
          win.document.documentElement.setAttribute('data-theme', 'dark');
        });
      })
      .wait(500) // Wait for theme transition
      .injectAxe()
      .checkA11y(
        null,
        {
          includedImpacts: ['critical', 'serious'],
        },
        terminalLog
      );
  });

  it('Has no detectable accessibility violations on blog (dark mode)', () => {
    cy.visit('/blog')
      .get('main')
      .should('be.visible')
      .then(() => {
        cy.window().then((win) => {
          win.document.documentElement.setAttribute('data-theme', 'dark');
        });
      })
      .wait(500) // Wait for theme transition
      .injectAxe()
      .checkA11y(
        null,
        {
          includedImpacts: ['critical', 'serious'],
        },
        terminalLog
      );
  });

  it('should navigate to blog page', () => {
    cy.visit('/');
    cy.get('a[href="/blog/"]', { timeout: 10000 }).click();
    cy.url().should('include', '/blog');
  });

  it('should navigate to blog post', () => {
    cy.visit('/blog/');
    cy.get('main article a', { timeout: 10000 }).first().click();
    cy.get('h1', { timeout: 10000 }).should('exist');
  });
});
