import React from 'react';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Button } from '@heroui/react';

interface ModalManagerProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  isConfirmDisabled?: boolean;
  children: React.ReactNode;
}

export function ModalManager({
  isOpen,
  title,
  onClose,
  onConfirm,
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  isConfirmDisabled,
  children,
}: ModalManagerProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(v) => !v && onClose()}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>{children}</ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>{cancelLabel}</Button>
          <Button color="primary" onPress={onConfirm} isDisabled={isConfirmDisabled}>{confirmLabel}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}