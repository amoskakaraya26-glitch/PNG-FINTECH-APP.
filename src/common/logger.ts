export const logAudit = (
  action: string,
  details: any
) => {
  console.log(
    JSON.stringify({
      action,
      details,
      timestamp: new Date()
    })
  );
};

