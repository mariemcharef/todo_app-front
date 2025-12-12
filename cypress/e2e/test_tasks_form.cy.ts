describe('Task Form E2E Tests', () => {
  const baseUrl = 'http://localhost:4200';
  const apiUrl = 'http://localhost:8001';

  beforeEach(() => {
    // Login first
    cy.visit(`${baseUrl}/login`);
    cy.get('input#username').type('m@yopmail.com');
    cy.get('input#password').type('123456');
    cy.get('form').submit();
    cy.url({ timeout: 10000 }).should('include', '/tasks');
  });

  describe('Opening Task Form', () => {
    it('should open create task form when clicking add button', () => {
      cy.get('button').contains(/add|create|new task/i).click();
      
      cy.get('.modal-overlay').should('be.visible');
      cy.contains('Create Task').should('be.visible');
    });

    it('should display all form fields', () => {
      cy.get('button').contains(/add|create|new task/i).click();
      
      cy.get('#title').should('be.visible');
      cy.get('#description').should('be.visible');
      cy.get('#due_date').should('be.visible');
      cy.get('#state').should('be.visible');
      cy.get('#tag').should('be.visible');
    });

    it('should have default state as "todo"', () => {
      cy.get('button').contains(/add|create|new task/i).click();
      
      cy.get('#state').should('have.value', 'todo');
    });
  });

  describe('Create Task Form Validation', () => {
    beforeEach(() => {
      cy.get('button').contains(/add|create|new task/i).click();
    });

    it('should show validation error for empty title', () => {
      cy.get('#title').focus().blur();
      
      cy.contains('Title is required').should('be.visible');
    });

    it('should show validation error for title less than 3 characters', () => {
      cy.get('#title').type('ab').blur();
      
      cy.contains(/at least 3 characters/i).should('be.visible');
    });

    it('should disable submit button when form is invalid', () => {
      cy.get('button[type="submit"]').should('be.disabled');
    });

    it('should enable submit button when title is valid', () => {
      cy.get('#title').type('Valid Task Title');
      
      cy.get('button[type="submit"]').should('not.be.disabled');
    });

    it('should not show validation errors initially', () => {
      cy.contains('Title is required').should('not.exist');
    });
  });

  describe('Creating a Task', () => {
    beforeEach(() => {
      cy.intercept('POST', `${apiUrl}/task`).as('createTask');
      cy.get('button').contains(/add|create|new task/i).click();
    });

    it('should create task with only required fields', () => {
      cy.get('#title').type('New Test Task');
      cy.get('button[type="submit"]').click();

      cy.wait('@createTask').its('response.statusCode').should('eq', 201);
      cy.get('.modal-overlay').should('not.exist');
    });

    it('should create task with all fields filled', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().slice(0, 16);

      cy.get('#title').type('Complete Task');
      cy.get('#description').type('This is a detailed description of the task');
      cy.get('#due_date').type(dateString);
      cy.get('#state').select('doing');
      cy.get('#tag').select('urgent');
      
      cy.get('button[type="submit"]').click();

      cy.wait('@createTask').then((interception) => {
        expect(interception.request.body).to.have.property('title', 'Complete Task');
        expect(interception.request.body).to.have.property('description');
        expect(interception.request.body).to.have.property('state', 'doing');
        expect(interception.request.body).to.have.property('tag', 'urgent');
      });
    });

    it('should send ISO date format to backend', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const dateString = futureDate.toISOString().slice(0, 16);

      cy.get('#title').type('Task with Date');
      cy.get('#due_date').type(dateString);
      cy.get('button[type="submit"]').click();

      cy.wait('@createTask').then((interception) => {
        expect(interception.request.body.due_date).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    it('should not send empty optional fields', () => {
      cy.get('#title').type('Minimal Task');
      cy.get('button[type="submit"]').click();

      cy.wait('@createTask').then((interception) => {
        expect(interception.request.body).to.not.have.property('description');
        expect(interception.request.body).to.not.have.property('due_date');
        expect(interception.request.body).to.not.have.property('tag');
      });
    });

    it('should refresh task list after creation', () => {
      cy.intercept('GET', `${apiUrl}/task?*`).as('getTasks');
      
      cy.get('#title').type('New Task');
      cy.get('button[type="submit"]').click();

      cy.wait('@createTask');
      cy.wait('@getTasks');
      
      cy.contains('New Task').should('be.visible');
    });

    it('should display error message on creation failure', () => {
      cy.intercept('POST', `${apiUrl}/task`, {
        statusCode: 400,
        body: { message: 'Task creation failed' }
      }).as('createTaskFailed');

      cy.get('#title').type('Failed Task');
      cy.get('button[type="submit"]').click();

      cy.wait('@createTaskFailed');
      cy.contains(/failed|error/i).should('be.visible');
    });
  });

  describe('Editing a Task', () => {
    beforeEach(() => {
      cy.intercept('GET', `${apiUrl}/task?*`).as('getTasks');
      cy.wait('@getTasks');
    });

    it('should open edit form with pre-filled data', () => {
      cy.get('[data-testid="task-item"]').first().find('button').contains(/edit/i).click();
      
      cy.contains('Edit Task').should('be.visible');
      cy.get('#title').should('not.have.value', '');
    });

    it('should update task successfully', () => {
      cy.intercept('PUT', `${apiUrl}/task/*`).as('updateTask');
      
      cy.get('[data-testid="task-item"]').first().find('button').contains(/edit/i).click();
      
      cy.get('#title').clear().type('Updated Task Title');
      cy.get('#description').clear().type('Updated description');
      cy.get('button[type="submit"]').click();

      cy.wait('@updateTask').its('response.statusCode').should('eq', 200);
      cy.get('.modal-overlay').should('not.exist');
    });

    it('should preserve unchanged fields when updating', () => {
      cy.intercept('PUT', `${apiUrl}/task/*`).as('updateTask');
      
      cy.get('[data-testid="task-item"]').first().find('button').contains(/edit/i).click();
      
      const originalState = cy.get('#state').invoke('val');
      cy.get('#title').clear().type('Modified Title');
      cy.get('button[type="submit"]').click();

      cy.wait('@updateTask').then((interception) => {
        expect(interception.request.body).to.have.property('title', 'Modified Title');
      });
    });

    it('should show update error message', () => {
      cy.intercept('PUT', `${apiUrl}/task/*`, {
        statusCode: 400,
        body: { message: 'Update failed' }
      }).as('updateTaskFailed');

      cy.get('[data-testid="task-item"]').first().find('button').contains(/edit/i).click();
      
      cy.get('#title').clear().type('Will Fail');
      cy.get('button[type="submit"]').click();

      cy.wait('@updateTaskFailed');
      cy.contains('Update failed').should('be.visible');
    });
  });

  describe('Modal Behavior', () => {
    beforeEach(() => {
      cy.get('button').contains(/add|create|new task/i).click();
    });

    it('should close modal when clicking close button', () => {
      cy.get('.close-btn').click();
      
      cy.get('.modal-overlay').should('not.exist');
    });

    it('should close modal when clicking cancel button', () => {
      cy.get('button').contains('Cancel').click();
      
      cy.get('.modal-overlay').should('not.exist');
    });

    it('should close modal when clicking overlay', () => {
      cy.get('.modal-overlay').click({ force: true });
      
      cy.get('.modal-overlay').should('not.exist');
    });

    it('should not close modal when clicking modal content', () => {
      cy.get('.modal-content').click();
      
      cy.get('.modal-overlay').should('be.visible');
    });

    it('should clear form data when closing without saving', () => {
      cy.get('#title').type('Unsaved Task');
      cy.get('.close-btn').click();
      
      cy.get('button').contains(/add|create|new task/i).click();
      cy.get('#title').should('have.value', '');
    });
  });

  describe('State Dropdown', () => {
    beforeEach(() => {
      cy.get('button').contains(/add|create|new task/i).click();
    });

    it('should have all state options', () => {
      cy.get('#state option').should('have.length', 3);
      cy.get('#state option').eq(0).should('have.value', 'todo').and('contain', 'To Do');
      cy.get('#state option').eq(1).should('have.value', 'doing').and('contain', 'In Progress');
      cy.get('#state option').eq(2).should('have.value', 'done').and('contain', 'Done');
    });

    it('should allow changing state', () => {
      cy.get('#state').select('doing');
      cy.get('#state').should('have.value', 'doing');
      
      cy.get('#state').select('done');
      cy.get('#state').should('have.value', 'done');
    });
  });

  describe('Tag Dropdown', () => {
    beforeEach(() => {
      cy.get('button').contains(/add|create|new task/i).click();
    });

    it('should have all tag options including None', () => {
      cy.get('#tag option').should('have.length', 4);
      cy.get('#tag option').eq(0).should('have.value', '').and('contain', 'None');
      cy.get('#tag option').eq(1).should('have.value', 'optional').and('contain', 'Optional');
      cy.get('#tag option').eq(2).should('have.value', 'important').and('contain', 'Important');
      cy.get('#tag option').eq(3).should('have.value', 'urgent').and('contain', 'Urgent');
    });

    it('should allow selecting and deselecting tags', () => {
      cy.get('#tag').select('urgent');
      cy.get('#tag').should('have.value', 'urgent');
      
      cy.get('#tag').select('');
      cy.get('#tag').should('have.value', '');
    });
  });

  describe('Due Date Field', () => {
    beforeEach(() => {
      cy.get('button').contains(/add|create|new task/i).click();
    });

    it('should have datetime-local input type', () => {
      cy.get('#due_date').should('have.attr', 'type', 'datetime-local');
    });

    it('should have min attribute set to current time', () => {
      cy.get('#due_date').should('have.attr', 'min');
    });

    it('should accept valid future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateString = futureDate.toISOString().slice(0, 16);

      cy.get('#due_date').type(dateString);
      cy.get('#due_date').should('have.value', dateString);
    });
  });

  describe('Description Field', () => {
    beforeEach(() => {
      cy.get('button').contains(/add|create|new task/i).click();
    });

    it('should be a textarea', () => {
      cy.get('#description').should('match', 'textarea');
    });

    it('should accept long text', () => {
      const longText = 'This is a very long description that spans multiple lines and contains a lot of information about the task. '.repeat(5);
      
      cy.get('#description').type(longText);
      cy.get('#description').should('have.value', longText);
    });

    it('should be optional', () => {
      cy.get('#title').type('Task without description');
      cy.get('button[type="submit"]').should('not.be.disabled');
    });
  });

  describe('Form Accessibility', () => {
    beforeEach(() => {
      cy.get('button').contains(/add|create|new task/i).click();
    });

    it('should have labels for all form fields', () => {
      cy.get('label[for="title"]').should('exist');
      cy.get('label[for="description"]').should('exist');
      cy.get('label[for="due_date"]').should('exist');
      cy.get('label[for="state"]').should('exist');
      cy.get('label[for="tag"]').should('exist');
    });

    it('should show required indicator for title', () => {
      cy.get('label[for="title"]').find('.required').should('contain', '*');
    });

    it('should have close button with aria-label', () => {
      cy.get('.close-btn').should('have.attr', 'aria-label', 'Close');
    });

    it('should be keyboard navigable', () => {
      cy.get('#title').focus().should('have.focus');
      cy.realPress('Tab');
      cy.focused().should('have.id', 'description');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      cy.get('button').contains(/add|create|new task/i).click();
    });

    it('should clear previous errors on new submission', () => {
      cy.intercept('POST', `${apiUrl}/task`, {
        statusCode: 400,
        body: { message: 'First error' }
      }).as('firstError');

      cy.get('#title').type('First Task');
      cy.get('button[type="submit"]').click();
      cy.wait('@firstError');
      cy.contains('First error').should('be.visible');

      cy.intercept('POST', `${apiUrl}/task`, {
        statusCode: 201,
        body: { id: 1 }
      }).as('success');

      cy.get('button[type="submit"]').click();
      cy.wait('@success');
      cy.contains('First error').should('not.exist');
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      cy.get('button').contains(/add|create|new task/i).click();
    });

    it('should disable submit button during submission', () => {
      cy.intercept('POST', `${apiUrl}/task`, (req) => {
        req.continue((res) => {
          res.delay = 1000;
        });
      }).as('slowCreate');

      cy.get('#title').type('Slow Task');
      cy.get('button[type="submit"]').click();

      // Button should be disabled during request
      cy.get('button[type="submit"]').should('be.disabled');
    });
  });
});