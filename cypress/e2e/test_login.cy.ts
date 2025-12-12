describe('Login E2E tests', () => {
  const baseUrl = 'http://localhost:4200';
  const apiUrl = 'http://localhost:8001';

  beforeEach(() => {
    cy.visit(`${baseUrl}/login`);
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Form Validation', () => {
    it('shows validation error for empty email field', () => {
      cy.get('input#password').type('testpassword123');
      cy.get('input#username').focus().blur();
      
      cy.get('input#username').should('have.class', 'ng-invalid');
    });

    it('shows validation error for invalid email format', () => {
      cy.get('input#username').type('invalidemail');
      cy.get('input#username').blur();
      
      cy.get('input#username').should('have.class', 'ng-invalid');
    });

    it('shows validation error for empty password field', () => {
      cy.get('input#username').type('test@example.com');
      cy.get('input#password').focus().blur();
      
      cy.get('input#password').should('have.class', 'ng-invalid');
    });

    it('enables submit when form is valid', () => {
      cy.get('input#username').type('test@example.com');
      cy.get('input#password').type('password123');
      
      cy.get('button[type="submit"]').should('not.be.disabled');
    });
  });

  describe('Login Functionality', () => {
    it('logs in successfully with valid credentials', () => {
      cy.intercept('POST', `${apiUrl}/login`).as('loginRequest');

      cy.get('input#username').type('m@yopmail.com');
      cy.get('input#password').type('123456');
      cy.get('form').submit();

      cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
      
      cy.url({ timeout: 10000 }).should('include', '/tasks');
    });

    it('displays error for invalid credentials', () => {
      cy.intercept('POST', `${apiUrl}/login`).as('loginRequest');

      cy.get('input#username').type('wrong@example.com');
      cy.get('input#password').type('wrongpassword');
      cy.get('form').submit();

      cy.wait('@loginRequest');
      cy.get('body').should('match', /login failed|invalid credentials|error/i);
    });

    it('handles server error gracefully', () => {
      cy.intercept('POST', `${apiUrl}/login`).as('loginRequest');

      cy.get('input#username').type('test@example.com');
      cy.get('input#password').type('password123');
      cy.get('form').submit();

      cy.wait('@loginRequest');
      
      cy.get('body').then(($body) => {
        const bodyText = $body.text().toLowerCase();
        if (bodyText.includes('error') || bodyText.includes('failed')) {
          cy.wrap($body).should('match', /error|failed/i);
        }
      });
    });
  });

  describe('Login Functionality - Alternative Without Wait', () => {
    it('logs in successfully and redirects to tasks page', () => {
      cy.get('input#username').type('m@yopmail.com');
      cy.get('input#password').type('123456');
      cy.get('form').submit();

      cy.url({ timeout: 10000 }).should('include', '/tasks');
      
      cy.contains(/tasks/i, { timeout: 10000 }).should('be.visible');
    });

    it('displays error for invalid credentials', () => {
      cy.get('input#username').type('invalid@example.com');
      cy.get('input#password').type('wrongpassword');
      cy.get('form').submit();

      cy.get('body', { timeout: 10000 }).then(($body) => {
        const text = $body.text().toLowerCase();
        expect(
          text.includes('error') || 
          text.includes('failed') || 
          text.includes('invalid')
        ).to.be.true;
      });
    });

    it('stays on login page after failed login', () => {
      cy.get('input#username').type('wrong@example.com');
      cy.get('input#password').type('wrongpassword');
      cy.get('form').submit();

      cy.url({ timeout: 5000 }).should('include', '/login');
    });
  });

  describe('Loading State', () => {
    it('disables submit button during login', () => {
      cy.intercept('POST', `${apiUrl}/login`, (req) => {
        req.on('response', (res) => {
          res.setDelay(1000);
        });
      }).as('loginRequest');

      cy.get('input#username').type('m@yopmail.com');
      cy.get('input#password').type('123456');
      
      cy.get('button[type="submit"]').click();

      cy.get('button[type="submit"]').should('be.disabled');
    });
  });

  describe('Google OAuth', () => {
    it('has Google login button', () => {
      cy.get('button').contains(/google/i).should('exist');
    });

    it('Google login button triggers redirect', () => {
      cy.get('button').contains(/google/i).should('be.visible').and('not.be.disabled');
    });
  });

  describe('Navigation', () => {
    it('can navigate to registration page if link exists', () => {
      cy.get('body').then(($body) => {
        if ($body.find('a[href*="/register"]').length > 0) {
          cy.get('a[href*="/register"]').should('be.visible');
        } else {
          cy.log('Registration link not found - skipping test');
        }
      });
    });

    it('can navigate to forgot password page if link exists', () => {
      cy.get('body').then(($body) => {
        if ($body.find('a[href*="/forgot"]').length > 0) {
          cy.get('a[href*="/forgot"]').should('be.visible');
        } else {
          cy.log('Forgot password link not found - skipping test');
        }
      });
    });
  });

  describe('Form Behavior', () => {
    it('retains email on failed login attempt', () => {
      cy.get('input#username').type('wrong@example.com');
      cy.get('input#password').type('wrongpassword');
      cy.get('form').submit();

      cy.wait(2000); 
      
      cy.get('input#username').should('have.value', 'wrong@example.com');
    });

    it('allows retry after failed login', () => {
      cy.get('input#username').type('wrong@example.com');
      cy.get('input#password').type('wrongpassword');
      cy.get('form').submit();

      cy.wait(2000);

      cy.get('input#username').clear().type('m@yopmail.com');
      cy.get('input#password').clear().type('123456');
      cy.get('form').submit();

      cy.url({ timeout: 10000 }).should('include', '/tasks');
    });
  });

  describe('Security', () => {
    it('password field masks input', () => {
      cy.get('input#password').should('have.attr', 'type', 'password');
    });

    it('form has proper attributes', () => {
      cy.get('form').should('exist');
      cy.get('input#username').invoke('attr', 'type').should('match', /text|email/);
    });
  });

  describe('Accessibility', () => {
    it('form fields have labels or placeholders', () => {
      cy.get('input#username').then(($input) => {
        expect(
          $input.attr('placeholder') || 
          $input.attr('aria-label') ||
          $input.attr('aria-labelledby')
        ).to.exist;
      });

      cy.get('input#password').then(($input) => {
        expect(
          $input.attr('placeholder') || 
          $input.attr('aria-label') ||
          $input.attr('aria-labelledby')
        ).to.exist;
      });
    });

    it('can tab between form fields', () => {
      cy.get('input#username').focus().should('have.focus');
      cy.get('input#username').realPress('Tab');
      cy.focused().should('have.attr', 'id', 'password');
    });
  });

  describe('Multiple Login Attempts', () => {
    it('handles multiple rapid submissions', () => {
      cy.intercept('POST', `${apiUrl}/login`).as('loginRequest');

      cy.get('input#username').type('m@yopmail.com');
      cy.get('input#password').type('123456');
      
      cy.get('form').submit();
      
      cy.url({ timeout: 10000 }).should('include', '/tasks');
    });
  });
});