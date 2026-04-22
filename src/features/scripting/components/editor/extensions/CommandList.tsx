import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';

interface CommandItem {
  title: string;
  description: string;
  icon: string;
  command: (args: any) => void;
}

export const CommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="bg-white border border-border-cream rounded-generous shadow-whisper overflow-hidden w-[280px] p-1.5 max-h-[360px] overflow-y-auto">
      {props.items.length ? (
        props.items.map((item: CommandItem, index: number) => (
          <button
            className={`w-full text-left px-3 py-2 rounded-comfort flex items-center gap-3 transition-all ${
              index === selectedIndex 
                ? 'bg-terracotta text-white shadow-sm' 
                : 'text-near-black hover:bg-parchment/60'
            }`}
            key={index}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <span className={`w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold shrink-0 ${
              index === selectedIndex 
                ? 'bg-white/20 text-white' 
                : 'bg-parchment text-olive-gray'
            }`}>
              {item.icon}
            </span>
            <div className="min-w-0">
              <div className={`text-xs font-bold truncate ${
                index === selectedIndex ? 'text-white' : 'text-near-black'
              }`}>
                {item.title}
              </div>
              <div className={`text-[10px] truncate ${
                index === selectedIndex ? 'text-white/70' : 'text-olive-gray'
              }`}>
                {item.description}
              </div>
            </div>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-xs text-olive-gray italic">No matching blocks</div>
      )}
    </div>
  );
});

CommandList.displayName = 'CommandList';
