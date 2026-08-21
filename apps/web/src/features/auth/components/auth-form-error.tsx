type AuthFormErrorProps = {
  message?: string;
};

export const AuthFormError = ({ message }: AuthFormErrorProps) =>
  message ? (
    <p
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {message}
    </p>
  ) : null;
