import * as React from 'react';

import { useCalloutEmojiPicker } from '@platejs/callout/react';
import { useEmojiDropdownMenuState } from '@platejs/emoji/react';
import { PlateElement } from 'platejs/react';

import { BlockInnerContainer } from './block-inner-container';

export function CalloutElement({
  attributes,
  children,
  className,
  ...props
}: React.ComponentProps<typeof PlateElement>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { emojiPickerState, isOpen, setIsOpen } = useEmojiDropdownMenuState({
    closeOnSelect: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { emojiToolbarDropdownProps, props: calloutProps } =
    useCalloutEmojiPicker({
      isOpen,
      setIsOpen,
    });

  return (
    <PlateElement
      attributes={{
        ...attributes,
        'data-plate-open-context-menu': true,
      }}
      {...props}
    >
      <BlockInnerContainer
        className={className}
        style={{
          backgroundColor: props.element.backgroundColor as any,
        }}
      >
        <div className="block-callout__body">
          {/* ToDo: Replace the dependency on @platejs/emoji and @emoji-mart/data */}
          {/* with something more lightweight and sane */}
          {/* <EmojiPopover
          {...emojiToolbarDropdownProps}
          control={
            <Button
              variant="ghost"
              className="size-6 p-1 text-[18px] select-none hover:bg-muted-foreground/15"
              style={{
                fontFamily:
                  '"Apple Color Emoji", "Segoe UI Emoji", NotoColorEmoji, "Noto Color Emoji", "Segoe UI Symbol", "Android Emoji", EmojiSymbols',
              }}
              contentEditable={false}
            >
              {(props.element.icon as any) || "💡"}
            </Button>
          }
        >
          <EmojiPicker {...emojiPickerState} {...calloutProps} />
        </EmojiPopover> */}
          <div className="block-callout__content">{children}</div>
        </div>
      </BlockInnerContainer>
    </PlateElement>
  );
}
