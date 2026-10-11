---
title: Fixing filesystem suddenly read-only on Linux with a Samsung SSD
date: '2025-10-29T00:00:00.000Z'
tags: [linux]
description: What to do when your Linux filesystem becomes read-only due to I/O errors from a Samsung SSD and how to update the firmware safely.
---

Sometimes your Linux system suddenly behaves oddly — apps crash, files can’t be saved, and `dmesg` shows I/O errors.
If you’re using a Samsung SSD (e.g. the 990 PRO), you might be running into a known firmware bug that causes the drive to stop responding, forcing the kernel to remount your filesystem read-only.

This guide shows how to **diagnose the issue, confirm it’s firmware-related, and safely update your SSD firmware** to fix it.

### Symptoms

- Suddenly unable to write files or save documents
- Programs fail to launch or crash with odd I/O errors
- dmesg shows lines like "I/O error" or the kernel remounting a filesystem read-only

Check the kernel log for evidence:

```bash
sudo journalctl -k -b | grep -iE "I/O error|read-only|remount"
# or
dmesg | grep -iE "I/O error|read-only|remount"
```

<Note type="tip">Repeated I/O errors followed by a read-only remount indicate the kernel is protecting your filesystem from further damage.</Note>

### Check SMART and NVMe health

Install smartctl if missing (smartmontools) and run SMART tests. For NVMe drives, use `nvme` tools.

```bash
# Install tools on Debian/Ubuntu
sudo apt update && sudo apt install -y smartmontools nvme-cli

# Check SMART for SATA-like drives
sudo smartctl -a /dev/sdX

# For NVMe drives
sudo nvme smart-log /dev/nvme0n1
```

Look for reallocated sectors, media errors, or other signs of hardware trouble.

### Root cause: Samsung firmware I/O bug

Some Samsung SSD firmware versions for models such as the 990 PRO have been reported to cause **intermittent I/O errors** leading to this behaviour. Samsung provides a firmware updater packaged as an ISO image which contains `fumagician`, a small tool for updating firmware on Linux.

<Note type="warning">
Updating firmware carries risk. Backup important data first and ensure you have a reliable power source (do not interrupt the firmware update).
</Note>

### Update firmware using Samsung's ISO (fumagician)

Below are the steps used to extract and run the updater from the ISO image. These are the commands I used; adjust filenames and device paths to match your system.

1. Download the ISO from Samsung's site (example file name shown):

```bash
wget https://download.semiconductor.samsung.com/resources/software-resources/Samsung_SSD_990_PRO_5B2QGXA7.iso
```

2. Create a mount point and mount the ISO:

```bash
sudo mkdir -p /mnt/iso
sudo mount -o loop Samsung_SSD_990_PRO_5B2QGXA7.iso /mnt/iso
```

3. Extract the initrd from the ISO to a local directory. The example here uses `unmkinitramfs` which is available on Debian/Ubuntu in the `initramfs-tools` package.

```bash
sudo apt install -y initramfs-tools # if you don't have unmkinitramfs
sudo unmkinitramfs /mnt/iso/initrd ~/990
```

4. Make the fumagician binary executable and run it

```bash
sudo chmod +x 990/root/fumagician/fumagician
sudo ./990/root/fumagician/fumagician
```

Follow the on-screen instructions from fumagician. It will detect attached Samsung SSDs and offer firmware update options.

### After the update

- Reboot the system and watch dmesg for further errors.
- If the problem disappears, monitor SMART data periodically.

```bash
sudo nvme smart-log /dev/nvme0n1
```

You can verify the firmware revision was applied by checking the drive's reported firmware version.

```bash
# Show NVMe devices (Firmware Revision column)
sudo nvme list

# More detailed controller info (look for "fr" / firmware revision)
sudo nvme id-ctrl /dev/nvme0n1 | grep -i "firmware\|fr"

# Or via smartctl
sudo smartctl -a /dev/nvme0n1 | grep -i firmware
```

### Final words

When Linux remounts a filesystem read-only, it’s protecting your data after repeated I/O errors. For Samsung SSDs like the 990 PRO, outdated firmware is often to blame.
Updating the firmware carefully and monitoring SMART data for a few days should confirm the issue is resolved.

### Resources
- [Samsung SSD firmware downloads](https://semiconductor.samsung.com/consumer-storage/support/tools/)
- [smartmontools](https://www.smartmontools.org/)
