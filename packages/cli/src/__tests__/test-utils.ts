export function castToJestMock<T>(value: T): jest.Mock<T> {
  return value as unknown as jest.Mock<T>;
}
