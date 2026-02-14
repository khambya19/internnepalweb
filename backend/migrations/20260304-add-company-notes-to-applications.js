module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Applications', 'companyNotes', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('Applications', 'companyNotes');
  },
};

