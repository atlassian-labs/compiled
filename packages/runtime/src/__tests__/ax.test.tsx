import ax from '../ax';

describe('ax', () => {
  it('should remove duplicates', () => {
    const result = ax('a1xum1fqe a1xum1eqe');

    expect(result).toEqual('a1xum1eqe');
  });

  it('should remove duplicates', () => {
    const result = ax('_1axum1fqe _1axum1eqe');

    expect(result).toEqual('_1axum1eqe');
  });
});
