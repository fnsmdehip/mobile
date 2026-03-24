/**
 * Type declarations for untyped modules and asset imports.
 */

declare module 'react-native-markdown-display' {
  import React from 'react';
  import { StyleProp, TextStyle, ViewStyle } from 'react-native';

  interface MarkdownProps {
    children: string;
    style?: Record<string, StyleProp<TextStyle | ViewStyle>>;
  }

  const Markdown: React.FC<MarkdownProps>;
  export default Markdown;
}

declare module 'react-native-signature-canvas' {
  import React from 'react';

  export interface SignatureViewRef {
    readSignature: () => void;
    clearSignature: () => void;
  }

  interface SignatureCanvasProps {
    onOK?: (signature: string) => void;
    onEnd?: () => void;
    onBegin?: () => void;
    descriptionText?: string;
    clearText?: string;
    confirmText?: string;
    webStyle?: string;
    ref?: React.Ref<SignatureViewRef>;
  }

  const SignatureCanvas: React.ForwardRefExoticComponent<
    SignatureCanvasProps & React.RefAttributes<SignatureViewRef>
  >;
  export default SignatureCanvas;
  export type { SignatureViewRef };
}

declare module '*.md' {
  const value: number;
  export default value;
}

declare module '*.png' {
  const value: number;
  export default value;
}
