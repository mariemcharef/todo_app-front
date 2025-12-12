describe('Task List E2E Tests', () => {
  const baseUrl = 'http://localhost:4200';
  const apiUrl = 'http://localhost:8001';

  beforeEach(() => {
    cy.visit(`${baseUrl}/login`);
    cy.get('input#username').type('m@yopmail.com');
    cy.get('input#password').type('123456');
    cy.get('form').submit();
    cy.url({ timeout: 10000 }).should('include', '/tasks');
  });

  describe('Page Layout and Header', () => {
    it('should display page title', () => {
      cy.contains('My Tasks').should('be.visible');
    });

    it('should display refresh button', () => {
      cy.contains('button', 'Refresh').should('be.visible');
    });

    it('should display create task button', () => {
      cy.contains('button', 'Create Task').should('be.visible');
    });

    it('should have functional header actions', () => {
      cy.get('.header-actions button').should('have.length', 2);
    });
  });

  describe('Task Statistics', () => {
    it('should display all stat cards', () => {
      cy.get('.task-stats .stat-item').should('have.length', 6);
    });

    it('should display total tasks stat', () => {
      cy.contains('.stat-item', 'Total').should('be.visible');
      cy.contains('.stat-item', 'Total').find('.stat-value').should('exist');
    });

    it('should display todo tasks stat', () => {
      cy.contains('.stat-item', 'Todo').should('be.visible');
    });

    it('should display doing tasks stat', () => {
      cy.contains('.stat-item', 'Doing').should('be.visible');
    });

    it('should display done tasks stat', () => {
      cy.contains('.stat-item', 'Done').should('be.visible');
    });

    it('should display overdue tasks stat', () => {
      cy.contains('.stat-item', 'Overdue').should('be.visible');
    });

    it('should display completion rate stat', () => {
      cy.contains('.stat-item', 'Completion').should('be.visible');
      cy.contains('.stat-item', 'Completion').find('.stat-value').should('contain', '%');
    });

    it('should update stats after creating a task', () => {
      cy.intercept('GET', `${apiUrl}/task/stats/summary`).as('getStats');
      
      cy.get('.stat-item').contains('Total').parent().find('.stat-value').invoke('text').then((initialTotal) => {
        cy.contains('button', 'Create Task').click();
        cy.get('#title').type('New Task for Stats');
        cy.get('button[type="submit"]').click();
        
        cy.wait('@getStats');
        cy.get('.stat-item').contains('Total').parent().find('.stat-value').should('not.have.text', initialTotal);
      });
    });
  });

  describe('Task List Display', () => {
    it('should display task cards when tasks exist', () => {
      cy.get('.task-card').should('exist');
    });

    it('should display empty state when no tasks exist', () => {
      cy.intercept('GET', `${apiUrl}/task?*`, {
        statusCode: 200,
        body: {
          status: 200,
          list: [],
          total_pages: 0,
          total_records: 0
        }
      });
      
      cy.reload();
      cy.contains('No tasks yet').should('be.visible');
      cy.contains('Create your first task to get started').should('be.visible');
    });

    it('should display task title', () => {
      cy.get('.task-card').first().find('.task-title').should('be.visible').and('not.be.empty');
    });

    it('should display task state badge', () => {
      cy.get('.task-card').first().find('.task-state-badge').should('be.visible');
    });

    it('should display task description if present', () => {
      cy.get('.task-card').first().then(($card) => {
        if ($card.find('.task-description').length > 0) {
          cy.wrap($card).find('.task-description').should('be.visible');
        }
      });
    });

    it('should display created date', () => {
      cy.get('.task-card').first().contains('Created:').should('be.visible');
    });

    it('should display action buttons', () => {
      cy.get('.task-card').first().within(() => {
        cy.contains('button', 'Edit').should('be.visible');
        cy.contains('button', 'Delete').should('be.visible');
      });
    });
  });

  describe('Task State Management', () => {
    it('should display correct state badge', () => {
      cy.get('.task-card').first().find('.task-state-badge').should('contain.text', /To Do|In Progress|Done/);
    });

    it('should change task state when clicking state badge', () => {
      cy.intercept('POST', `${apiUrl}/task/*/toggle`).as('toggleState');
      
      cy.get('.task-card').first().find('.task-state-badge').click();
      
      cy.wait('@toggleState').its('response.statusCode').should('eq', 200);
    });

    it('should change task state using next state button', () => {
      cy.intercept('POST', `${apiUrl}/task/*/toggle`).as('toggleState');
      
      cy.get('.task-card').first().contains('button', 'Next:').click();
      
      cy.wait('@toggleState').its('response.statusCode').should('eq', 200);
    });

    it('should cycle through states: todo -> doing -> done -> todo', () => {
      cy.intercept('POST', `${apiUrl}/task/*/toggle`).as('toggleState');
      
      const taskCard = cy.get('.task-card').first();
      
      // Click state badge multiple times
      taskCard.find('.task-state-badge').click();
      cy.wait('@toggleState');
      
      taskCard.find('.task-state-badge').click();
      cy.wait('@toggleState');
      
      taskCard.find('.task-state-badge').click();
      cy.wait('@toggleState');
    });

    it('should show completed styling for done tasks', () => {
      cy.get('.task-card').each(($card) => {
        cy.wrap($card).find('.task-state-badge').then(($badge) => {
          if ($badge.text().includes('Done')) {
            cy.wrap($card).should('have.class', 'completed');
          }
        });
      });
    });
  });

  describe('Task Checkbox Functionality', () => {
    it('should have checkbox for each task', () => {
      cy.get('.task-card').first().find('.task-checkbox').should('exist');
    });

    it('should mark task as done when checkbox is checked', () => {
      cy.intercept('POST', `${apiUrl}/task/*/done`).as('markAsDone');
      
      cy.get('.task-card').first().find('.task-checkbox:not(:checked)').first().check();
      
      cy.wait('@markAsDone').its('response.statusCode').should('eq', 200);
    });

    it('should reopen task when unchecking done task', () => {
      cy.intercept('POST', `${apiUrl}/task/*/toggle`).as('toggleState');
      
      cy.get('.task-card').first().find('.task-checkbox:checked').first().uncheck();
      
      cy.wait('@toggleState').its('response.statusCode').should('eq', 200);
    });

    it('should display success message after completing task', () => {
      cy.intercept('POST', `${apiUrl}/task/*/done`).as('markAsDone');
      
      cy.get('.task-card').first().find('.task-checkbox:not(:checked)').first().check();
      
      cy.wait('@markAsDone');
      cy.contains('Task completed').should('be.visible');
    });
  });

  describe('Task Priority Tags', () => {
    it('should display priority tag if present', () => {
      cy.get('.task-card').then(($cards) => {
        $cards.each((index, card) => {
          const $card = Cypress.$(card);
          if ($card.find('.task-tag-badge').length > 0) {
            cy.wrap(card).find('.task-tag-badge').should('be.visible');
          }
        });
      });
    });

    it('should have correct styling for different tag types', () => {
      cy.get('.task-tag-badge').each(($badge) => {
        cy.wrap($badge).should('have.class', /tag-(optional|important|urgent)/);
      });
    });
  });

  describe('Overdue Tasks', () => {
    it('should display overdue badge for past due tasks', () => {
      cy.get('.task-card').each(($card) => {
        if (Cypress.$($card).find('.overdue-badge').length > 0) {
          cy.wrap($card).find('.overdue-badge').should('contain', 'Overdue');
        }
      });
    });

    it('should have overdue styling for past due tasks', () => {
      cy.get('.task-card.overdue').each(($card) => {
        cy.wrap($card).find('.overdue-badge').should('be.visible');
      });
    });

    it('should show warning icon for overdue tasks', () => {
      cy.get('.task-card.overdue').each(($card) => {
        cy.wrap($card).find('.overdue-icon').should('contain', '⚠️');
      });
    });
  });

  describe('Edit Task', () => {
    it('should open edit modal when clicking edit button', () => {
      cy.get('.task-card').first().contains('button', 'Edit').click();
      
      cy.get('.modal-overlay').should('be.visible');
      cy.contains('Edit Task').should('be.visible');
    });

    it('should pre-fill form with task data', () => {
      cy.get('.task-card').first().find('.task-title').invoke('text').then((title) => {
        cy.get('.task-card').first().contains('button', 'Edit').click();
        
        cy.get('#title').should('have.value', title.trim());
      });
    });

    it('should update task list after saving changes', () => {
      cy.intercept('PUT', `${apiUrl}/task/*`).as('updateTask');
      cy.intercept('GET', `${apiUrl}/task?*`).as('getTasks');
      
      cy.get('.task-card').first().contains('button', 'Edit').click();
      cy.get('#title').clear().type('Updated Task Title');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@updateTask');
      cy.wait('@getTasks');
      cy.contains('Updated Task Title').should('be.visible');
    });
  });

  describe('Delete Task', () => {
    it('should show confirmation dialog when deleting', () => {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(false);
        
        cy.get('.task-card').first().contains('button', 'Delete').click();
        
        cy.wrap(win.confirm).should('have.been.called');
      });
    });

    it('should not delete if user cancels confirmation', () => {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(false);
        
        cy.get('.task-card').its('length').then((initialCount) => {
          cy.get('.task-card').first().contains('button', 'Delete').click();
          cy.get('.task-card').should('have.length', initialCount);
        });
      });
    });

    it('should delete task after confirmation', () => {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      
      cy.intercept('DELETE', `${apiUrl}/task/*`).as('deleteTask');
      cy.intercept('GET', `${apiUrl}/task?*`).as('getTasks');
      
      cy.get('.task-card').first().contains('button', 'Delete').click();
      
      cy.wait('@deleteTask').its('response.statusCode').should('eq', 200);
      cy.wait('@getTasks');
    });

    it('should show success message after deletion', () => {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      
      cy.intercept('DELETE', `${apiUrl}/task/*`).as('deleteTask');
      
      cy.get('.task-card').first().contains('button', 'Delete').click();
      
      cy.wait('@deleteTask');
      cy.contains('deleted successfully').should('be.visible');
    });
  });

  describe('Pagination', () => {
    it('should display pagination when multiple pages exist', () => {
      cy.intercept('GET', `${apiUrl}/task?*`, {
        statusCode: 200,
        body: {
          status: 200,
          list: Array(10).fill(null).map((_, i) => ({
            id: i + 1,
            title: `Task ${i + 1}`,
            state: 'todo',
            created_on: new Date().toISOString()
          })),
          total_pages: 3,
          total_records: 25
        }
      });
      
      cy.reload();
      cy.get('.pagination').should('be.visible');
    });

    it('should show current page number', () => {
      cy.get('.pagination').then(($pagination) => {
        if ($pagination.length > 0) {
          cy.get('.page-indicator').should('contain', 'Page');
        }
      });
    });

    it('should navigate to next page', () => {
      cy.get('.pagination').then(($pagination) => {
        if ($pagination.length > 0) {
          cy.intercept('GET', `${apiUrl}/task?page_number=2*`).as('getPage2');
          
          cy.contains('button', 'Next').click();
          cy.wait('@getPage2');
        }
      });
    });

    it('should navigate to previous page', () => {
      cy.get('.pagination').then(($pagination) => {
        if ($pagination.length > 0) {
          cy.intercept('GET', `${apiUrl}/task?page_number=2*`).as('getPage2');
          cy.contains('button', 'Next').click();
          cy.wait('@getPage2');
          
          cy.intercept('GET', `${apiUrl}/task?page_number=1*`).as('getPage1');
          cy.contains('button', 'Previous').click();
          cy.wait('@getPage1');
        }
      });
    });

    it('should disable previous button on first page', () => {
      cy.get('.pagination').then(($pagination) => {
        if ($pagination.length > 0) {
          cy.contains('button', 'Previous').should('be.disabled');
        }
      });
    });

    it('should display total record count', () => {
      cy.get('.pagination').then(($pagination) => {
        if ($pagination.length > 0) {
          cy.get('.record-count').should('contain', 'task');
        }
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should reload tasks when clicking refresh button', () => {
      cy.intercept('GET', `${apiUrl}/task?*`).as('getTasks');
      
      cy.contains('button', 'Refresh').click();
      
      cy.wait('@getTasks').its('response.statusCode').should('eq', 200);
    });

    it('should reload stats when refreshing', () => {
      cy.intercept('GET', `${apiUrl}/task/stats/summary`).as('getStats');
      
      cy.contains('button', 'Refresh').click();
      
      cy.wait('@getStats').its('response.statusCode').should('eq', 200);
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failed load', () => {
      cy.intercept('GET', `${apiUrl}/task?*`, {
        statusCode: 500,
        body: { message: 'Server error' }
      });
      
      cy.reload();
      cy.contains(/error/i).should('be.visible');
    });

    it('should allow closing error message', () => {
      cy.intercept('GET', `${apiUrl}/task?*`, {
        statusCode: 500,
        body: { message: 'Server error' }
      });
      
      cy.reload();
      cy.get('.error-message').should('be.visible');
      cy.get('.error-message .message-close').click();
      cy.get('.error-message').should('not.exist');
    });

    it('should display error when delete fails', () => {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      
      cy.intercept('DELETE', `${apiUrl}/task/*`, {
        statusCode: 400,
        body: { message: 'Cannot delete task' }
      });
      
      cy.get('.task-card').first().contains('button', 'Delete').click();
      cy.contains('Cannot delete task').should('be.visible');
    });
  });

  describe('Success Messages', () => {
    it('should display success message after creating task', () => {
      cy.contains('button', 'Create Task').click();
      cy.get('#title').type('Success Test Task');
      cy.get('button[type="submit"]').click();
      
      cy.contains(/saved successfully/i).should('be.visible');
    });

    it('should auto-hide success message after delay', () => {
      cy.contains('button', 'Create Task').click();
      cy.get('#title').type('Auto Hide Test');
      cy.get('button[type="submit"]').click();
      
      cy.contains(/saved successfully/i).should('be.visible');
      cy.wait(3500);
      cy.contains(/saved successfully/i).should('not.exist');
    });

    it('should allow closing success message manually', () => {
      cy.contains('button', 'Create Task').click();
      cy.get('#title').type('Manual Close Test');
      cy.get('button[type="submit"]').click();
      
      cy.get('.success-message').should('be.visible');
      cy.get('.success-message .message-close').click();
      cy.get('.success-message').should('not.exist');
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      cy.intercept('GET', `${apiUrl}/task?*`, {
        statusCode: 200,
        body: {
          status: 200,
          list: [],
          total_pages: 0,
          total_records: 0
        }
      });
      
      cy.reload();
    });

    it('should display empty state icon', () => {
      cy.get('.empty-icon').should('be.visible');
    });

    it('should display empty state message', () => {
      cy.contains('No tasks yet').should('be.visible');
    });

    it('should have create button in empty state', () => {
      cy.get('.empty-state').contains('button', 'Create').should('be.visible');
    });

    it('should open create modal from empty state button', () => {
      cy.get('.empty-state').contains('button', 'Create').click();
      cy.get('.modal-overlay').should('be.visible');
    });
  });

  describe('Task Metadata', () => {
    it('should display created date for all tasks', () => {
      cy.get('.task-card').each(($card) => {
        cy.wrap($card).contains('Created:').should('be.visible');
      });
    });

    it('should display due date if present', () => {
      cy.get('.task-card').each(($card) => {
        cy.wrap($card).then(($el) => {
          if ($el.text().includes('Due:')) {
            cy.wrap($card).contains('Due:').should('be.visible');
          }
        });
      });
    });

    it('should format dates correctly', () => {
      cy.get('.task-card').first().find('.meta-text').first().should('match', /\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for actions', () => {
      cy.contains('button', 'Previous').should('have.attr', 'aria-label', 'Previous page');
      cy.contains('button', 'Next').should('have.attr', 'aria-label', 'Next page');
    });

    it('should have role attribute for messages', () => {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      
      cy.intercept('DELETE', `${apiUrl}/task/*`).as('deleteTask');
      cy.get('.task-card').first().contains('button', 'Delete').click();
      cy.wait('@deleteTask');
      
      cy.get('.success-message').should('have.attr', 'role', 'status');
    });

    it('should have accessible checkbox labels', () => {
      cy.get('.task-card').first().find('.task-checkbox').should('have.attr', 'id');
      cy.get('.task-card').first().find('.checkbox-label').should('have.attr', 'for');
    });
  });

  describe('Performance', () => {
    it('should load tasks within acceptable time', () => {
      const startTime = Date.now();
      cy.reload();
      cy.get('.task-card').should('exist').then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it('should not make duplicate API calls on mount', () => {
      let callCount = 0;
      cy.intercept('GET', `${apiUrl}/task?*`, (req) => {
        callCount++;
        req.reply({
          statusCode: 200,
          body: { status: 200, list: [], total_pages: 0, total_records: 0 }
        });
      });
      
      cy.reload();
      cy.wait(1000);
      cy.wrap(null).should(() => {
        expect(callCount).to.equal(1);
      });
    });
  });
});