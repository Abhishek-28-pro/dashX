'use client';

import React, { useState } from 'react';
import { QuickActions } from './QuickActions';
import { ReportModal } from '@/components/report/ReportModal';
import { useRouter } from 'next/navigation';

export function HomeClientWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <QuickActions onOpenReportModal={() => setIsModalOpen(true)} />
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onReportCreated={() => {
          router.refresh();
        }}
      />
    </>
  );
}
