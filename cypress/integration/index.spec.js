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

  // Log detailed information about each violation
  violations.forEach((violation) => {
    cy.task('log', `\n❌ ${violation.id}: ${violation.description}`);
    violation.nodes.forEach((node) => {
      cy.task('log', `   Element: ${node.html}`);
      cy.task('log', `   Target: ${node.target.join(' ')}`);
      if (node.any.length > 0) {
        cy.task('log', `   Issue: ${node.any[0].message}`);
        if (node.any[0].data) {
          cy.task(
            'log',
            `   Data: ${JSON.stringify(node.any[0].data, null, 2)}`
          );
        }
      }
    });
  });
}

describe('Accessibility tests', () => {
  it.skip('Has no detectable accessibility violations on home (light mode)', () => {
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

  it.skip('Has no detectable accessibility violations on blog (light mode)', () => {
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
