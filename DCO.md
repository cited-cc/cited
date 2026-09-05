# Developer Certificate of Origin

Cited uses the Developer Certificate of Origin (DCO) version 1.1 for
contribution signoff. This is not a Contributor License Agreement (CLA).

## How to sign off

Add a signoff line to every commit that contains a contribution:

```bash
git commit -s -m "Your commit message"
```

This adds a `Signed-off-by:` trailer with your name and email.

## What signoff means

Signoff certifies that you agree to the following statement for each
contribution:

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.


Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

## Signoff is not cryptographic commit signing

DCO signoff (`git commit -s`) is separate from GPG or SSH commit signing
(`git commit -S`). Either may be requested in the future, but Phase 3 requires
DCO signoff only.

## Licensing of contributions

Contributions are licensed under the same license as the project:
AGPL-3.0-only. DCO signoff does not automatically grant the project the right
to relicense contributions under a proprietary commercial license.

If the project later accepts contributions intended for proprietary
relicensing, a separate CLA would require legal review before use.
