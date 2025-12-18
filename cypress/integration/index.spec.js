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
  beforeEach(() => {
    // Explicitly set to light mode to make tests deterministic
    cy.window().then((win) => {
      win.document.documentElement.removeAttribute('data-theme');
    });
  });

  it('Has no detectable accessibility violations on home (light mode)', () => {
    cy.visit('/')
      .get('main')
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
    cy.visit('/blog')
      .get('main')
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
    cy.visit('/')
      .get('a[href="/blog/"]')
      .click()
      .url()
      .should('include', '/blog');
  });

  it('should navigate to blog post', () => {
    cy.visit('/blog/')
      .get('main article a')
      .first()
      .click()
      .get('h1')
      .should('exist');
  });
});
