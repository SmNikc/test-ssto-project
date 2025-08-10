describe('Заявка на тестирование', () => {
  it('Успешное создание заявки', () => {
    cy.visit('/');
    cy.get('button').contains('Новая заявка').click();
    cy.get('input[name="mmsi"]').type('123456789');
    cy.get('input[name="vessel_name"]').type('Test Vessel');
    cy.get('input[name="ssas_number"]').type('SSAS001');
    cy.get('input[name="owner_organization"]').type('OwnerOrg');
    cy.get('input[name="contact_person"]').type('Ivan');
    cy.get('input[name="contact_phone"]').type('+79991234567');
    cy.get('input[name="email"]').type('user@email.com');
    cy.get('input[name="test_date"]').type('2025-08-09');
    cy.get('input[name="start_time"]').type('12:00');
    cy.get('input[name="end_time"]').type('13:00');
    cy.get('button[type="submit"]').click();
    cy.contains('Заявка успешно отправлена!').should('exist');
  });
});
жду
7. Полная автоматизация: сквозные тесты, запуск, документация, CI/CD
