import ax from '../ax';

describe('ax', () => {
  it('should remove duplicates', () => {
    const result = ax('cc-1e4pr9v-bf54id cc-1e4pr9v-5scuol');

    expect(result).toEqual('cc-1e4pr9v-5scuol');
  });
});
