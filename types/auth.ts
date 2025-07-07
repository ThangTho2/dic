export type LoginResponse =
  | {
      message: 'Login successful';
      user: {
        userName: string;
        email: string;
        refreshToken: string;
      };
    }
  | {
      error: string;
    };
export type CheckRegisterResponse =
  | {
      message: 'Can register with this email';
      canRegister: true;
    }
  | {
      error: 'Email already exists';
      canRegister: false;
    };

