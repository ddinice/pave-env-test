import { SaveIcon } from "../icons/icons";
import { Button } from "../ui/button";
import { Tooltip } from "../ui/tooltip";

export function DrawerFooter({ formId }: { formId: string }) {
  return (
    <footer className="drawer-footer">
      <Tooltip label="Save changes">
        <Button
          aria-label="Save changes"
          className="save-icon-button"
          form={formId}
          type="submit"
        >
          <SaveIcon />
        </Button>
      </Tooltip>
    </footer>
  );
}
